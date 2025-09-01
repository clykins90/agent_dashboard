import { NextRequest } from "next/server";
export const runtime = "nodejs";
import { getAgentConfig, setAgentConfig } from "@/lib/store";
import { AgentConfig } from "@/lib/types";

export async function GET() {
  const agentConfig = await getAgentConfig();
  return Response.json(agentConfig);
}

export async function PUT(req: NextRequest) {
  const agentConfig = (await req.json()) as AgentConfig;
  await setAgentConfig(agentConfig);
  return Response.json({ ok: true });
}


