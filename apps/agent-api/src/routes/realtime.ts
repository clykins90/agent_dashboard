import { FastifyInstance } from 'fastify';
import { OPENAI_API_KEY, REALTIME_MODEL, DEFAULT_VOICE } from '../config';

export async function registerRealtimeRoutes(app: FastifyInstance) {
  app.get('/realtime/token', async (_req, reply) => {
    if (!OPENAI_API_KEY) {
      reply.code(500).send({ error: 'Missing OPENAI_API_KEY' });
      return;
    }
    try {
      const resp = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: REALTIME_MODEL, ...(DEFAULT_VOICE ? { voice: DEFAULT_VOICE } : {}) }),
      });
      if (!resp.ok) {
        app.log.error({ status: resp.status }, 'Failed to mint realtime session');
        reply.code(500).send({ error: 'Failed to mint token' });
        return;
      }
      const json = await resp.json();
      const token = (json?.client_secret?.value ?? '') as string;
      const expiresAt = json?.client_secret?.expires_at as number | undefined;
      if (!token) {
        reply.code(500).send({ error: 'No token in response' });
        return;
      }
      reply.send({ token, expiresAt });
    } catch (err) {
      app.log.error({ err }, 'Error minting token');
      reply.code(500).send({ error: 'Server error' });
    }
  });
}
