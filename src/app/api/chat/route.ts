import { NextRequest } from "next/server";
import { z as zod } from "zod";
import { streamText, type CoreMessage, type Tool, type ToolSet } from "ai";
import { openai } from "@ai-sdk/openai";
import { getAgentConfig, saveTranscript } from "@/lib/store";
import { ChatMessage, Transcript } from "@/lib/types";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const requestBody = await req.json();
  const incomingMessages = (requestBody?.messages || []) as ChatMessage[];
  const agentConfig = await getAgentConfig();

  const tools: ToolSet = {} as ToolSet;

  for (const tool of agentConfig.tools) {
    const shape: Record<string, zod.ZodTypeAny> = {};
    for (const p of tool.params) {
      shape[p.name] = p.required ? zod.string() : zod.string().optional();
    }

    const toolDefinition: Tool<Record<string, unknown>, unknown> = {
      description: tool.description,
      inputSchema: zod.object(shape),
      execute: async (args: Record<string, unknown>) => {
        const url = new URL(tool.url);
        for (const [paramName, paramValue] of Object.entries(args)) {
          if (paramValue !== undefined && paramValue !== null) {
            url.searchParams.set(paramName, String(paramValue));
          }
        }
        const res = await fetch(url.toString());
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, status: res.status, data };
      },
    };
    (tools as Record<string, Tool<Record<string, unknown>, unknown>>)[tool.name] = toolDefinition;
  }

  const systemContent = agentConfig.systemPrompt?.trim()
    ? [{ role: "system" as const, content: agentConfig.systemPrompt }]
    : [];

  const toCoreMessage = (message: ChatMessage): CoreMessage | null => {
    if (message.role === "system" || message.role === "user" || message.role === "assistant") {
      return { role: message.role, content: message.content } as CoreMessage;
    }
    return null;
  };

  const coreMessages: CoreMessage[] = [
    ...systemContent,
    ...incomingMessages.map(toCoreMessage).filter(Boolean) as CoreMessage[],
  ];

  const result = streamText({
    model: openai(agentConfig.model),
    tools,
    messages: coreMessages,
  });

  // Persist transcript start
  const transcript: Transcript = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    messages: [
      ...(systemContent.length
        ? [{ role: "system", content: agentConfig.systemPrompt } as ChatMessage]
        : []),
      ...incomingMessages,
    ],
  };
  await saveTranscript(transcript);

  return result.toTextStreamResponse();
}


