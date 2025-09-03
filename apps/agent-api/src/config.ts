import dotenv from 'dotenv';
import path from 'path';

// Load env files in development/local contexts. In production (Vercel),
// env vars are injected and should not be overridden by files.
if (!process.env.VERCEL) {
  const cwd = process.cwd();
  // Try app-local first (apps/agent-api/.env.local, .env)
  dotenv.config({ path: path.join(cwd, '.env.local') });
  dotenv.config({ path: path.join(cwd, '.env') });
  // Then try repo root fallbacks (../../.env.local, ../../.env)
  dotenv.config({ path: path.resolve(cwd, '..', '..', '.env.local') });
  dotenv.config({ path: path.resolve(cwd, '..', '..', '.env') });
}

export const PORT: number = Number(process.env.PORT || 8787);
export const OPENAI_API_KEY: string | null = process.env.OPENAI_API_KEY || null;
export const REALTIME_MODEL: string = process.env.REALTIME_MODEL || 'gpt-realtime';
export const DEFAULT_VOICE: string | undefined = process.env.DEFAULT_VOICE || undefined;
export const PUBLIC_WS_URL: string = process.env.PUBLIC_WS_URL || (process.env as any).AGENT_API_PUBLIC_URL || '';
export const AUTH_TOKEN: string | null = process.env.AUTH_TOKEN || null;

// Per-IP rate limiting for /realtime/token
export const TOKEN_RATE_LIMIT_MAX: number = Number(process.env.TOKEN_RATE_LIMIT_MAX || 30);
export const TOKEN_RATE_LIMIT_WINDOW_MS: number = Number(process.env.TOKEN_RATE_LIMIT_WINDOW_MS || 60_000);

const ALLOWED_ORIGINS_RAW = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
export const ALLOWED_ORIGINS: string[] = ALLOWED_ORIGINS_RAW;

export function isOriginAllowed(origin?: string): boolean {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.length === 0) return true;
  if (ALLOWED_ORIGINS.includes('*')) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

