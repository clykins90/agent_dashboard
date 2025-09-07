import { OPENAI_API_KEY, REALTIME_MODEL } from "../config";


export async function mintRealtimeSession() {
  const resp = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session: {
        type: "realtime",
        model: REALTIME_MODEL,
      },
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Failed to mint realtime session: ${resp.status} ${text}`);
  }

  const json = (await resp.json()) as { value?: string; expires_at?: number };
  const token = json.value;
  const expiresAt = json.expires_at;

  if (!token) {
    throw new Error(`No token in response: ${JSON.stringify(json)}`);
  }

  return { token, expiresAt };
}