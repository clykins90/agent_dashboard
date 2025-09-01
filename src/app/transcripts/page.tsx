import { listTranscripts } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function TranscriptsPage() {
  const transcripts = await listTranscripts();
  return (
    <div className="max-w-4xl mx-auto p-6 flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Transcripts</h1>
      {transcripts.length === 0 ? (
        <div className="text-sm text-gray-500">No transcripts yet.</div>
      ) : (
        <ul className="flex flex-col gap-3">
          {transcripts.map((t) => (
            <li key={t.id} className="border rounded p-3">
              <div className="text-sm text-gray-500">{new Date(t.createdAt).toLocaleString()}</div>
              <div className="mt-2 text-sm whitespace-pre-wrap">
                {t.messages
                  .slice(0, 6)
                  .map((m) => `${m.role}: ${m.content}`)
                  .join("\n")}
                {t.messages.length > 6 ? "\n…" : ""}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


