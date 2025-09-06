import { FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import { OpenAIRealtimeWebSocket } from '@openai/agents-realtime';
import { OPENAI_API_KEY, REALTIME_MODEL, DEFAULT_VOICE, PUBLIC_WS_URL } from '../config';
import { promises as fs } from 'fs';
import path from 'path';

type ToolParam = { name: string; required: boolean };
type ToolConfig = { name: string; description: string; url: string; params: ToolParam[] };
type AgentConfig = { systemPrompt: string; model: string; tools: ToolConfig[] };

async function loadAgentConfig(app: FastifyInstance): Promise<AgentConfig | null> {
  try {
    // Resolve repo-root data path from app cwd (apps/agent-api)
    const filePath = path.resolve(process.cwd(), '..', '..', 'data', 'agent_dashboard', 'agentConfig.json');
    const raw = await fs.readFile(filePath, 'utf8');
    const json = JSON.parse(raw) as AgentConfig;
    return json;
  } catch (err) {
    app.log.warn({ err }, 'Failed to load agentConfig.json; falling back to defaults');
    return null;
  }
}

function toRealtimeFunctionTools(config: AgentConfig | null): any[] | undefined {
  if (!config || !Array.isArray(config.tools) || config.tools.length === 0) return undefined;
  return config.tools.map((t) => {
    const properties: Record<string, any> = {};
    const required: string[] = [];
    for (const p of t.params || []) {
      properties[p.name] = { type: 'string' };
      if (p.required) required.push(p.name);
    }
    return {
      type: 'function',
      name: t.name,
      description: t.description,
      parameters: { type: 'object', properties, required },
    };
  });
}

export async function registerTwilioRoutes(app: FastifyInstance) {
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

  app.get('/twilio/stream', { websocket: true }, async (socket) => {
    app.log.info('Twilio stream connected');

    if (!OPENAI_API_KEY) {
      app.log.error('Missing OPENAI_API_KEY for Twilio bridge');
      socket.close();
      return;
    }

    const agentConfig = await loadAgentConfig(app);

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
          // Inject instructions and tools into session config
          instructions: agentConfig?.systemPrompt || 'You are a helpful assistant.',
          tools: toRealtimeFunctionTools(agentConfig),
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

    // Basic function tool execution: proxy function call outputs by fetching configured URL
    transport.on('function_call', async (toolCall) => {
      try {
        const name = toolCall.name;
        const args = JSON.parse(toolCall.arguments || '{}') as Record<string, unknown>;
        const t = agentConfig?.tools.find((x) => x.name === name);
        if (!t) {
          transport.sendFunctionCallOutput(toolCall as any, `Tool not found: ${name}`, true);
          return;
        }
        const url = new URL(t.url);
        for (const [paramName, paramValue] of Object.entries(args)) {
          if (paramValue !== undefined && paramValue !== null) {
            url.searchParams.set(paramName, String(paramValue));
          }
        }
        const res = await fetch(url.toString());
        const data = await res.json().catch(() => ({}));
        const body = JSON.stringify({ ok: res.ok, status: res.status, data });
        transport.sendFunctionCallOutput(toolCall as any, body, true);
      } catch (err) {
        app.log.warn({ err }, 'Error executing function tool');
        try { transport.sendFunctionCallOutput(toolCall as any, 'Tool execution error', true); } catch {}
      }
    });

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
        // Start initial greeting as soon as the stream starts
        try {
          transport.sendEvent({ type: 'response.create' });
        } catch {}
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
