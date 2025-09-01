import { getAgentConfig, setAgentConfig } from "@/lib/store";
import SettingsForm from "./settings/SettingsForm";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const config = await getAgentConfig();
  const modelOptions: string[] = [
    "gpt-5o",
    "gpt-5.1",
    "gpt-5-mini",
  ];

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
