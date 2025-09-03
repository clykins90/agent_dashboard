import { OPENAI_API_KEY, REALTIME_MODEL } from "../config";

type RealtimeSessionJson = {
  client_secret?: {
    value?: string;
    expires_at?: number;
  };
};

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

  const json = (await resp.json()) as RealtimeSessionJson & { value?: string; expires_at?: number };
  const token = (json.client_secret?.value || json.value) as string | undefined;
  const expiresAt = (json.client_secret?.expires_at ?? json.expires_at) as number | undefined;

  if (!token) {
    throw new Error(`No token in response: ${JSON.stringify(json)}`);
  }

  return { token, expiresAt };
}