import { getAgentConfig, setAgentConfig } from "@/lib/store";
import SettingsForm from "./settings/SettingsForm";
import { revalidatePath } from "next/cache";
import { gateway, createGateway } from "@ai-sdk/gateway";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const config = await getAgentConfig();
  let modelOptions: string[] = [];
  try {
    const gw = process.env.AI_GATEWAY_API_KEY
      ? createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY })
      : gateway;
    const { models } = await gw.getAvailableModels();
    modelOptions = models
      .filter((m) => m.modelType === "language")
      .map((m) => m.id);
  } catch {
    modelOptions = ["openai/gpt-4o", "openai/gpt-4o-mini"];
  }

  async function save(formData: FormData) {
    "use server";
    const model = String(formData.get("model") ?? "");
    const systemPrompt = String(formData.get("systemPrompt") ?? "");
    const toolsJson = String(formData.get("toolsJson") ?? "[]");
    await setAgentConfig({ model, systemPrompt, tools: JSON.parse(toolsJson) });
    revalidatePath("/settings");
  }

  return <SettingsForm initialConfig={config} save={save} modelOptions={modelOptions} />;
}
