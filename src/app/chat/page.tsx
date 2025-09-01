"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/types";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const streamRef = useRef<ReadableStreamDefaultReader | null>(null);

  const uiMessages = useMemo(() => messages, [messages]);

  async function send() {
    if (!userInput.trim()) return;
    const nextMessages = [...messages, { role: "user", content: userInput } as ChatMessage];
    setMessages(nextMessages);
    setUserInput("");
    setIsLoading(true);

    const response = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: nextMessages }),
    });

    const reader = response.body?.getReader();
    if (!reader) {
      setIsLoading(false);
      return;
    }
    streamRef.current = reader;

    const decoder = new TextDecoder();
    let assistantResponse = "";
    while (true) {
      const { done, value: chunkValue } = await reader.read();
      if (done) break;
      const decodedChunk = decoder.decode(chunkValue);
      assistantResponse += decodedChunk;
      setMessages((previousMessages) => {
        const lastMessage = previousMessages[previousMessages.length - 1];
        const previousExceptLast = previousMessages.slice(0, -1);
        if (lastMessage?.role === "assistant") {
          return [...previousExceptLast, { role: "assistant", content: assistantResponse } as ChatMessage];
        }
        return [...previousMessages, { role: "assistant", content: assistantResponse } as ChatMessage];
      });
    }
    setIsLoading(false);
  }

  useEffect(() => {
    return () => {
      streamRef.current?.cancel().catch(() => {});
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


