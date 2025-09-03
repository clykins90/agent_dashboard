import { FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import { OpenAIRealtimeWebSocket } from '@openai/agents-realtime';
import { OPENAI_API_KEY, REALTIME_MODEL, DEFAULT_VOICE, PUBLIC_WS_URL } from '../config';

export async function registerTwilioRoutes(app: FastifyInstance) {
  // Ensure websocket plugin is available to this scope
  if (!(app as any).websocketServer) {
    await app.register(websocket);
  }

  app.post('/twilio/voice', async (_req, reply) => {
    const wsUrl = (PUBLIC_WS_URL || '').replace(/^http/i, 'ws');
    const streamUrl = wsUrl ? `${wsUrl.replace(/\/$/, '')}/twilio/stream` : '';
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Connect>\n    <Stream url="${streamUrl}"/>\n  </Connect>\n</Response>`;
    reply.header('Content-Type', 'application/xml');
    reply.send(twiml);
  });

  app.get('/twilio/stream', { websocket: true }, (socket) => {
    app.log.info('Twilio stream connected');

    if (!OPENAI_API_KEY) {
      app.log.error('Missing OPENAI_API_KEY for Twilio bridge');
      socket.close();
      return;
    }

    let streamSid: string | null = null;
    let closed = false;

    const transport = new OpenAIRealtimeWebSocket();
    transport
      .connect({
        apiKey: OPENAI_API_KEY,
        model: REALTIME_MODEL,
        initialSessionConfig: {
          outputModalities: ['audio'],
          audio: {
            input: {
              format: { type: 'audio/pcmu' }, // Twilio sends G.711 mu-law 8kHz
              // Keep VAD on (default) so we don't need to commit manually
            },
            output: {
              format: { type: 'audio/pcmu' }, // Stream mu-law 8kHz back to Twilio
              ...(DEFAULT_VOICE ? { voice: DEFAULT_VOICE } : {}),
              speed: 1,
            },
          },
        },
      })
      .catch((err: unknown) => {
        app.log.error({ err }, 'Failed to connect to OpenAI Realtime');
        try { socket.close(); } catch {}
      });

    function sendTwilioMedia(base64Payload: string) {
      if (!streamSid || closed) return;
      const payload = JSON.stringify({ event: 'media', streamSid, media: { payload: base64Payload } });
      try {
        socket.send(payload);
      } catch (err) {
        app.log.warn({ err }, 'Failed sending media to Twilio');
      }
    }

    function chunkAndSendToTwilio(buffer: ArrayBuffer) {
      // Twilio expects 20ms frames at 8kHz mu-law => 160 bytes per frame
      const BYTES_PER_CHUNK = 160;
      const view = new Uint8Array(buffer);
      for (let i = 0; i < view.length; i += BYTES_PER_CHUNK) {
        const slice = view.subarray(i, i + BYTES_PER_CHUNK);
        const b64 = Buffer.from(slice).toString('base64');
        sendTwilioMedia(b64);
      }
    }

    transport.on('audio', (audioEvent: { type: string; data: ArrayBuffer }) => {
      try {
        chunkAndSendToTwilio(audioEvent.data);
      } catch (err) {
        app.log.warn({ err }, 'Error handling output audio');
      }
    });

    socket.on('message', (message: Buffer) => {
      let obj: any = null;
      try {
        obj = JSON.parse(message.toString());
      } catch {
        app.log.debug('Non-JSON message from Twilio');
        return;
      }

      const event = obj?.event;
      if (event === 'start') {
        streamSid = obj?.start?.streamSid || obj?.streamSid || null;
        app.log.info({ streamSid }, 'Twilio stream started');
        return;
      }
      if (event === 'media') {
        const payload = obj?.media?.payload as string | undefined;
        if (!payload) return;
        try {
          const buff = Buffer.from(payload, 'base64');
          // send mu-law bytes directly; transport config expects audio/pcmu
          transport.sendAudio(buff.buffer.slice(buff.byteOffset, buff.byteOffset + buff.byteLength));
        } catch (err) {
          app.log.debug({ err }, 'Failed to forward media to OpenAI');
        }
        return;
      }
      if (event === 'stop') {
        app.log.info({ streamSid }, 'Twilio stream stopped');
        try { transport.close(); } catch {}
        try { socket.close(); } catch {}
        closed = true;
        return;
      }
    });

    socket.on('close', () => {
      app.log.info('Twilio stream disconnected');
      closed = true;
      try { transport.close(); } catch {}
    });
  });
}
