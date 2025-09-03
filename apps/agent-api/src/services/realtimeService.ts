import { OPENAI_API_KEY, REALTIME_MODEL, DEFAULT_VOICE } from "../config";

type RealtimeSessionJson = {
  client_secret?: {
    value?: string;
    expires_at?: number;
  };
};

export async function mintRealtimeSession() {
  const resp = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: REALTIME_MODEL,
      ...(DEFAULT_VOICE ? { voice: DEFAULT_VOICE } : {}),
    }),
  });

  if (!resp.ok) {
    throw new Error(`Failed to mint realtime session: ${resp.status}`);
  }

  const json = (await resp.json()) as RealtimeSessionJson;
  const token = json.client_secret?.value as string;
  const expiresAt = json.client_secret?.expires_at as number | undefined;

  if (!token) {
    throw new Error("No token in response");
  }

  return { token, expiresAt };
}