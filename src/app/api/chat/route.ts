import { NextRequest } from "next/server";
import { z as zod } from "zod";
import { Agent, run, tool, user, assistant } from "@openai/agents";
import { OpenAIProvider, setDefaultOpenAIKey } from "@openai/agents-openai";
import { getAgentConfig, saveTranscript } from "@/lib/store";
import { ChatMessage, Transcript } from "@/lib/types";

export const maxDuration = 30;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const requestBody = await req.json();
  const incomingMessages = (requestBody?.messages || []) as ChatMessage[];
  const agentConfig = await getAgentConfig();

  if (process.env.OPENAI_API_KEY) {
    setDefaultOpenAIKey(process.env.OPENAI_API_KEY);
  }

  const functionTools = agentConfig.tools.map((t) => {
    const shape: Record<string, zod.ZodTypeAny> = {};
    for (const p of t.params) {
      shape[p.name] = p.required ? zod.string() : zod.string().optional();
    }
    return tool({
      name: t.name,
      description: t.description,
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

  const modelId = (agentConfig.model || "gpt-4o-mini").replace(/^openai\//, "");

  const provider = new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY, useResponses: true });
  const model = await provider.getModel(modelId);

  const agent = new Agent({
    name: "Assistant",
    instructions: agentConfig.systemPrompt || "You are a helpful assistant.",
    tools: functionTools,
    model,
  });

  const items = incomingMessages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => (m.role === "user" ? user(m.content) : assistant(m.content)));

  const result = await run(agent, items);

  // Persist transcript start
  const transcript: Transcript = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    messages: [
      ...(agentConfig.systemPrompt?.trim()
        ? [{ role: "system", content: agentConfig.systemPrompt } as ChatMessage]
        : []),
      ...incomingMessages,
    ],
  };
  await saveTranscript(transcript);

  return Response.json({ text: result.finalOutput ?? "" });
}


