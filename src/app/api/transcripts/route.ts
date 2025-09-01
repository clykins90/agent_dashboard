import { listTranscripts } from "@/lib/store";

export async function GET() {
  const transcripts = await listTranscripts();
  return Response.json(transcripts);
}


