import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { AgentConfig, Transcript, ChatMessage } from "./types";

const baseDataDirectory = process.env.DATA_DIR
  ? process.env.DATA_DIR
  : process.env.VERCEL
  ? os.tmpdir()
  : path.join(process.cwd(), "data");
const DATA_DIRECTORY = path.join(baseDataDirectory, "agent_dashboard");
const AGENT_CONFIG_FILE = path.join(DATA_DIRECTORY, "agentConfig.json");
const TRANSCRIPTS_FILE = path.join(DATA_DIRECTORY, "transcripts.json");

async function ensureDataDirectory(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIRECTORY, { recursive: true });
  } catch {
    // ignore
  }
}

async function readJsonFile<T>(filePath: string, fallbackValue: T): Promise<T> {
  try {
    const rawContents = await fs.readFile(filePath, "utf8");
    return JSON.parse(rawContents) as T;
  } catch {
    return fallbackValue;
  }
}

async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  await ensureDataDirectory();
  const jsonString = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, jsonString, "utf8");
}

const defaultAgentConfig: AgentConfig = {
  systemPrompt:
    "You are a helpful assistant. When tools are used, ALWAYS summarize the relevant results clearly for the user. Include dates/times and key fields. If the tool returns a list, extract the top items with times and names.",
  model: "gpt-4o-mini",
  tools: [],
};

export async function getAgentConfig(): Promise<AgentConfig> {
  return readJsonFile<AgentConfig>(AGENT_CONFIG_FILE, defaultAgentConfig);
}

export async function setAgentConfig(config: AgentConfig): Promise<void> {
  await writeJsonFile<AgentConfig>(AGENT_CONFIG_FILE, config);
}

export async function listTranscripts(): Promise<Transcript[]> {
  return readJsonFile<Transcript[]>(TRANSCRIPTS_FILE, []);
}

export async function saveTranscript(transcript: Transcript): Promise<void> {
  const allTranscripts = await listTranscripts();
  allTranscripts.unshift(transcript);
  await writeJsonFile<Transcript[]>(TRANSCRIPTS_FILE, allTranscripts);
}

export async function appendToTranscript(
  transcriptId: string,
  message: ChatMessage
): Promise<void> {
  const allTranscripts = await listTranscripts();
  const targetIndex = allTranscripts.findIndex((transcript) => transcript.id === transcriptId);
  if (targetIndex === -1) return;
  allTranscripts[targetIndex].messages.push(message);
  await writeJsonFile<Transcript[]>(TRANSCRIPTS_FILE, allTranscripts);
}


