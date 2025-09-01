"use client";
import { useState } from "react";
import type { AgentConfig, ToolConfig } from "@/lib/types";

export default function SettingsForm({ initialConfig, save, modelOptions }: { initialConfig: AgentConfig; save: (fd: FormData) => Promise<void>; modelOptions: string[] }) {
  const [agentConfig, setAgentConfigState] = useState<AgentConfig>(initialConfig);
  const [saving, setSaving] = useState(false);

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
      const nextTools = current.tools.map((t, i) =>
        i === index
          ? { ...t, params: [...t.params, { name: "param" + (t.params.length + 1), required: false }] }
          : t
      );
    
      return { ...current, tools: nextTools };
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const fd = new FormData(event.currentTarget);
    fd.set("toolsJson", JSON.stringify(agentConfig.tools));
    await save(fd);
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="p-6 max-w-3xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Agent Settings</h1>

      <label className="flex flex-col gap-2">
        <span className="text-sm">Model
          <span className="ml-2 text-xs text-gray-500" title="Choose an LLM.">(?)</span>
        </span>
        <select
          className="border rounded px-3 py-2"
          name="model"
          value={agentConfig.model}
          onChange={(e) => setAgentConfigState((current) => ({ ...current, model: e.target.value }))}
        >
          {modelOptions.map((id) => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm">System Prompt
          <span className="ml-2 text-xs text-gray-500" title="Sets behavior. e.g., instruct the agent to call tools and summarize results for the user.">(?)</span>
        </span>
        <textarea
          className="border rounded px-3 py-2 min-h-40"
          name="systemPrompt"
          value={agentConfig.systemPrompt}
          onChange={(e) => setAgentConfigState((current) => ({ ...current, systemPrompt: e.target.value }))}
          placeholder="You are a helpful assistant..."
        />
      </label>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium">Tools</h2>
        <button type="button" onClick={addTool} className="border px-3 py-1 rounded">Add tool</button>
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
              <button type="button" onClick={() => removeTool(idx)} className="border px-3 py-1 rounded">Remove</button>
            </div>
            <input
              className="border rounded px-2 py-1"
              value={tool.description}
              onChange={(e) => updateTool(idx, { description: e.target.value })}
              placeholder="Describe when this tool should be used"
            />
            <input
              className="border rounded px-2 py-1"
              value={tool.url}
              onChange={(e) => updateTool(idx, { url: e.target.value })}
              placeholder="Public API base URL (GET). Params appended as query string."
              title="Example: https://api.example.com/search?query=..."
            />
            <div className="flex items-center justify-between">
              <div className="font-medium">Params</div>
              <button type="button" onClick={() => addParam(idx)} className="border px-3 py-1 rounded">Add param</button>
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
                        const nextTools = current.tools.map((t, i) =>
                          i === idx
                            ? { ...t, params: t.params.map((pp, j) => (j === pidx ? { ...pp, name } : pp)) }
                            : t
                        );
                        return { ...current, tools: nextTools };
                      });
                    }}
                    placeholder="param name"
                    title="Query parameter name appended to the tool URL"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={param.required}
                      onChange={(e) => {
                        const required = e.target.checked;
                        setAgentConfigState((current) => {
                          const nextTools = current.tools.map((t, i) =>
                            i === idx
                              ? { ...t, params: t.params.map((pp, j) => (j === pidx ? { ...pp, required } : pp)) }
                              : t
                          );
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

      <input type="hidden" name="toolsJson" value="" />
      <div className="flex gap-3">
        <button disabled={saving} type="submit" className="border px-4 py-2 rounded">
          {saving ? "Saving..." : "Save settings"}
        </button>
      </div>
    </form>
  );
}


