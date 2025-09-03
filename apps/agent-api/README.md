# Agent API (Fastify)

TypeScript Fastify backend for OpenAI Realtime and Twilio bridging.

## Endpoints

- GET /health — liveness
- GET /realtime/token — mints ephemeral client token for WebRTC (model: gpt-realtime)
- POST /twilio/voice — TwiML: connects a Twilio Media Stream to /twilio/stream
- WS /twilio/stream — placeholder WebSocket for Twilio Media Streams

## Environment

- OPENAI_API_KEY — required
- REALTIME_MODEL — default gpt-realtime
- DEFAULT_VOICE — optional
- ALLOWED_ORIGINS — CSV list of origins (e.g. https://app.example.com,http://localhost:3000)
- PUBLIC_WS_URL — public base URL for this service (used in TwiML)
- PORT — default 8787

## Run locally

npm run api:dev
# or build & start
npm run api:build && npm run api:start

## Deploy

- Recommended: Fly.io or Cloud Run (set min instances > 0). Provide env vars above.
- Expose HTTPS and set PUBLIC_WS_URL to your service URL.

## Notes

- The Twilio stream handler is a stub. Next step is wiring to the Agents SDK Twilio transport to bridge audio to OpenAI Realtime.

