import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { PORT, isOriginAllowed } from './config';
import { registerHealthRoutes } from './routes/health';
import { registerRealtimeRoutes } from './routes/realtime';
import { registerTwilioRoutes } from './routes/twilio';

async function bootstrap() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: (origin, cb) => {
      if (isOriginAllowed(origin)) return cb(null, true);
      cb(new Error('Not allowed'), false);
    },
  });

  await app.register(websocket);

  await registerHealthRoutes(app);
  await registerRealtimeRoutes(app);
  await registerTwilioRoutes(app);

  app
    .listen({ port: PORT, host: '0.0.0.0' })
    .then(() => {
      app.log.info(`agent-api listening on :${PORT}`);
    })
    .catch((err) => {
      app.log.error(err);
      process.exit(1);
    });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
