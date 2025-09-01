import { FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import { PUBLIC_WS_URL } from '../config';

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

  app.get('/twilio/stream', { websocket: true }, (connection) => {
    app.log.info('Twilio stream connected');
    connection.socket.on('message', (message: Buffer) => {
      app.log.debug({ len: message?.length }, 'Twilio WS message');
    });
    connection.socket.on('close', () => {
      app.log.info('Twilio stream disconnected');
    });
  });
}
