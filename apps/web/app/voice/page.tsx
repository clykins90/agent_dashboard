"use client";
import { useEffect, useRef, useState } from "react";
import { RealtimeAgent, RealtimeSession, tool } from "@openai/agents-realtime";
import { z as zod } from "zod";

export default function VoicePage() {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<string>("");
  const sessionRef = useRef<RealtimeSession | null>(null);

  async function connect() {
    setStatus("Connecting…");
    // Load agent config (system prompt, model, tools) from server
    const configRes = await fetch("/api/agent", { cache: "no-store" });
    if (!configRes.ok) throw new Error("Failed to load agent config");
    const agentConfig = await configRes.json();

    // Build runtime tools from config
    const functionTools = (agentConfig.tools || []).map((t: { name: string; description?: string; url: string; params?: Array<{ name: string; required?: boolean }>; }) => {
      const shape: Record<string, zod.ZodTypeAny> = {};
      for (const p of t.params || []) {
        shape[p.name] = p.required ? zod.string() : zod.string().optional();
      }
      return tool({
        name: t.name,
        description: t.description ?? `Tool: ${t.name}`,
        parameters: zod.object(shape),
        execute: async (args: Record<string, unknown>) => {
          const url = new URL(t.url);
          for (const [paramName, paramValue] of Object.entries(args)) {
            if (paramValue !== undefined && paramValue !== null) {
              url.searchParams.set(paramName, String(paramValue));
            }
          }
          const res = await fetch(url.toString());
          const data = await res.json().catch(() => ({}));
          return { ok: res.ok, status: res.status, data } as unknown as string;
        },
      });
    });

    const agent = new RealtimeAgent({
      name: "Voice Assistant",
      instructions: agentConfig.systemPrompt || "You are a helpful assistant.",
      tools: functionTools,
    });
    const session = new RealtimeSession(agent, { model: "gpt-realtime" });
    sessionRef.current = session;
    await session.connect({
      apiKey: async () => {
        const base = process.env.NEXT_PUBLIC_AGENT_API_URL || "";
        const url = base ? `${base.replace(/\/$/, '')}/realtime/token` : "/api/voice/token";
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to get token");
        const data = await res.json().catch(() => null);
        return (data?.token as string) || (await res.text());
      },
    });
    // Kick off an initial response so the agent greets immediately on connect
    try {
      session.transport.sendEvent({ type: "response.create" });
    } catch {
      // ignore
    }
    setConnected(true);
    setStatus("Connected");
  }

  function disconnect() {
    sessionRef.current?.close();
    sessionRef.current = null;
    setConnected(false);
    setStatus("Disconnected");
  }

  useEffect(() => {
    return () => {
      sessionRef.current?.close();
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Voice Agent</h1>
      <div className="text-sm text-gray-600">{status}</div>
      <div className="flex gap-3">
        <button onClick={connect} disabled={connected} className="border px-4 py-2 rounded">
          Connect
        </button>
        <button onClick={disconnect} disabled={!connected} className="border px-4 py-2 rounded">
          Disconnect
        </button>
      </div>
      <p className="text-sm text-gray-500">On connect, your microphone and speakers are used via WebRTC.</p>
    </div>
  );
}



