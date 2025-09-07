export type ToolParameter = {
  name: string;
  required: boolean;
};

export type ToolConfig = {
  name: string;
  description: string;
  url: string; // Base URL for GET requests
  params: ToolParameter[]; // Query params accepted by the tool
};

export type AgentConfig = {
  systemPrompt: string;
  model: string; // e.g., "gpt-4o", "gpt-4o-mini"
  tools: ToolConfig[];
};

export type ChatMessageRole = "system" | "user" | "assistant" | "tool";

export type ChatMessage = {
  id?: string;
  role: ChatMessageRole;
  content: string;
  name?: string; // For tool messages
};

export type Transcript = {
  id: string;
  createdAt: string;
  messages: ChatMessage[];
};



