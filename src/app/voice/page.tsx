"use client";
import { useEffect, useRef, useState } from "react";
import { RealtimeAgent, RealtimeSession } from "@openai/agents-realtime";

export default function VoicePage() {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<string>("");
  const sessionRef = useRef<RealtimeSession | null>(null);

  async function connect() {
    setStatus("Connecting…");
    const agent = new RealtimeAgent({
      name: "Voice Assistant",
      instructions: "You are a helpful assistant.",
    });
    const session = new RealtimeSession(agent);
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
      model: "gpt-realtime",
    });
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


