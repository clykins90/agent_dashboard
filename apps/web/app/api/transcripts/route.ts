import { listTranscripts } from "@/lib/store";
export const runtime = "nodejs";

export async function GET() {
  const transcripts = await listTranscripts();
  return Response.json(transcripts);
}


