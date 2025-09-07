"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage } from "@agent-dashboard/shared";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [debugEnabled, setDebugEnabled] = useState(false);
  const streamRef = useRef<ReadableStreamDefaultReader | null>(null);

  const uiMessages = useMemo(() => messages, [messages]);

  async function send() {
    if (!userInput.trim()) return;
    const nextMessages = [...messages, { role: "user", content: userInput } as ChatMessage];
    setMessages(nextMessages);
    setUserInput("");
    setIsLoading(true);

    const response = await fetch(`/api/chat${debugEnabled ? "?debug=1" : ""}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: nextMessages }),
    });
    const data = await response.json();
    setMessages((previousMessages) => [...previousMessages, { role: "assistant", content: data.text } as ChatMessage]);
    setIsLoading(false);
  }

  useEffect(() => {
    const readerAtMount = streamRef.current;
    return () => {
      readerAtMount?.cancel().catch(() => {});
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Chat</h1>
      <div className="border rounded p-3 min-h-64 flex flex-col gap-3">
        {uiMessages.map((message, index) => (
          <div key={index} className="text-sm">
            <span className="font-medium">{message.role}: </span>
            <span className="whitespace-pre-wrap">{message.content}</span>
          </div>
        ))}
        {isLoading && <div className="text-sm text-gray-500">Thinking…</div>}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={debugEnabled} onChange={(e) => setDebugEnabled(e.target.checked)} />
        Enable debug logging (server)
      </label>
      <div className="flex gap-2">
        <input
          className="border rounded px-3 py-2 flex-1"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Ask something…"
        />
        <button onClick={send} className="border px-4 py-2 rounded">Send</button>
      </div>
    </div>
  );
}



