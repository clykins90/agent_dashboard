export type ToolParameter = {
    name: string;
    required: boolean;
};
export type ToolConfig = {
    name: string;
    description: string;
    url: string;
    params: ToolParameter[];
};
export type AgentConfig = {
    systemPrompt: string;
    model: string;
    tools: ToolConfig[];
};
export type ChatMessageRole = "system" | "user" | "assistant" | "tool";
export type ChatMessage = {
    id?: string;
    role: ChatMessageRole;
    content: string;
    name?: string;
};
export type Transcript = {
    id: string;
    createdAt: string;
    messages: ChatMessage[];
};
