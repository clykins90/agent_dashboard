"use client";
import { useEffect, useState } from "react";
import type { AgentConfig, ToolConfig } from "@/lib/types";

export default function SettingsPage() {
  const [agentConfig, setAgentConfigState] = useState<AgentConfig>({ systemPrompt: "", model: "gpt-4o-mini", tools: [] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const response = await fetch("/api/agent");
      const data = await response.json();
      setAgentConfigState(data);
    })();
  }, []);

  function updateTool(index: number, patch: Partial<ToolConfig>) {
    setAgentConfigState((current) => {
      const nextTools = [...current.tools];
      nextTools[index] = { ...nextTools[index], ...patch } as ToolConfig;
      return { ...current, tools: nextTools };
    });
  }

  function addTool() {
    setAgentConfigState((current) => ({
      ...current,
      tools: [
        ...current.tools,
        { name: "tool" + (current.tools.length + 1), description: "", url: "", params: [] },
      ],
    }));
  }

  function removeTool(index: number) {
    setAgentConfigState((current) => ({ ...current, tools: current.tools.filter((_, i) => i !== index) }));
  }

  function addParam(index: number) {
    setAgentConfigState((current) => {
      const nextTools = [...current.tools];
      const targetTool = nextTools[index];
      targetTool.params = [...targetTool.params, { name: "param" + (targetTool.params.length + 1), required: false }];
      return { ...current, tools: nextTools };
    });
  }

  async function save() {
    setSaving(true);
    await fetch("/api/agent", { method: "PUT", body: JSON.stringify(agentConfig) });
    setSaving(false);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Agent Settings</h1>

      <label className="flex flex-col gap-2">
        <span className="text-sm">Model</span>
        <input
          className="border rounded px-3 py-2"
          value={agentConfig.model}
          onChange={(e) => setAgentConfigState((current) => ({ ...current, model: e.target.value }))}
          placeholder="openai/gpt-4o (with Gateway) or gpt-4o (direct)"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm">System Prompt</span>
        <textarea
          className="border rounded px-3 py-2 min-h-40"
          value={agentConfig.systemPrompt}
          onChange={(e) => setAgentConfigState((current) => ({ ...current, systemPrompt: e.target.value }))}
          placeholder="You are a helpful assistant..."
        />
      </label>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium">Tools</h2>
        <button onClick={addTool} className="border px-3 py-1 rounded">Add tool</button>
      </div>

      <div className="flex flex-col gap-4">
        {agentConfig.tools.map((tool, idx) => (
          <div key={idx} className="border p-3 rounded flex flex-col gap-3">
            <div className="flex gap-3">
              <input
                className="border rounded px-2 py-1 flex-1"
                value={tool.name}
                onChange={(e) => updateTool(idx, { name: e.target.value })}
                placeholder="Tool name"
              />
              <button onClick={() => removeTool(idx)} className="border px-3 py-1 rounded">Remove</button>
            </div>
            <input
              className="border rounded px-2 py-1"
              value={tool.description}
              onChange={(e) => updateTool(idx, { description: e.target.value })}
              placeholder="Description"
            />
            <input
              className="border rounded px-2 py-1"
              value={tool.url}
              onChange={(e) => updateTool(idx, { url: e.target.value })}
              placeholder="https://api.example.com/search"
            />
            <div className="flex items-center justify-between">
              <div className="font-medium">Params</div>
              <button onClick={() => addParam(idx)} className="border px-3 py-1 rounded">Add param</button>
            </div>
            <div className="flex flex-col gap-2">
              {tool.params.map((param, pidx) => (
                <div key={pidx} className="flex gap-3 items-center">
                  <input
                    className="border rounded px-2 py-1 flex-1"
                    value={param.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setAgentConfigState((current) => {
                        const nextTools = [...current.tools];
                        const targetTool = nextTools[idx];
                        targetTool.params = targetTool.params.map((pp, i) => (i === pidx ? { ...pp, name } : pp));
                        return { ...current, tools: nextTools };
                      });
                    }}
                    placeholder="param name"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={param.required}
                      onChange={(e) => {
                        const required = e.target.checked;
                        setAgentConfigState((current) => {
                          const nextTools = [...current.tools];
                          const targetTool = nextTools[idx];
                          targetTool.params = targetTool.params.map((pp, i) => (i === pidx ? { ...pp, required } : pp));
                          return { ...current, tools: nextTools };
                        });
                      }}
                    />
                    required
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button disabled={saving} onClick={save} className="border px-4 py-2 rounded">
          {saving ? "Saving..." : "Save settings"}
        </button>
      </div>
    </div>
  );
}


