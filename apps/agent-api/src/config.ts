export const PORT: number = Number(process.env.PORT || 8787);
export const OPENAI_API_KEY: string | null = process.env.OPENAI_API_KEY || null;
export const REALTIME_MODEL: string = process.env.REALTIME_MODEL || 'gpt-realtime';
export const DEFAULT_VOICE: string | undefined = process.env.DEFAULT_VOICE || undefined;
export const PUBLIC_WS_URL: string = process.env.PUBLIC_WS_URL || (process.env as any).AGENT_API_PUBLIC_URL || '';

const ALLOWED_ORIGINS_RAW = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
export const ALLOWED_ORIGINS: string[] = ALLOWED_ORIGINS_RAW;

export function isOriginAllowed(origin?: string): boolean {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.length === 0) return true;
  if (ALLOWED_ORIGINS.includes('*')) return true;
  return ALLOWED_ORIGINS.includes(origin);
}
