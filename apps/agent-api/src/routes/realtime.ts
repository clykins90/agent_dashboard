import { FastifyInstance } from "fastify";
import { mintRealtimeSession } from "../services/realtimeService";
import { AUTH_TOKEN, TOKEN_RATE_LIMIT_MAX, TOKEN_RATE_LIMIT_WINDOW_MS } from "../config";

type IpRecord = { count: number; windowStart: number };
const ipCounters: Map<string, IpRecord> = new Map();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = ipCounters.get(ip);
  if (!record) {
    ipCounters.set(ip, { count: 1, windowStart: now });
    return false;
  }
  if (now - record.windowStart > TOKEN_RATE_LIMIT_WINDOW_MS) {
    ipCounters.set(ip, { count: 1, windowStart: now });
    return false;
  }
  record.count += 1;
  return record.count > TOKEN_RATE_LIMIT_MAX;
}

export async function registerRealtimeRoutes(app: FastifyInstance) {
  app.get("/realtime/token", async (req, reply) => {
    // Simple bearer token auth (or skip if AUTH_TOKEN not set)
    if (AUTH_TOKEN) {
      const authHeader = req.headers["authorization"] || req.headers["Authorization"];
      const token = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length)
        : null;
      if (!token || token !== AUTH_TOKEN) {
        reply.code(401).send({ error: "Unauthorized" });
        return;
      }
    }

    // Per-IP rate limiting
    const ip = (req.ip || req.socket.remoteAddress || "unknown").toString();
    if (isRateLimited(ip)) {
      reply.code(429).send({ error: "Too Many Requests" });
      return;
    }

    try {
      const { token, expiresAt } = await mintRealtimeSession();
      reply.send({ token, expiresAt });
    } catch (err) {
      app.log.error({ err }, "Error minting token");
      reply.code(500).send({ error: "Server error" });
    }
  });
}