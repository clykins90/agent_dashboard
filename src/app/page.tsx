export default function Home() {
  return (
    <div className="font-sans min-h-screen p-8 pb-20 sm:p-20 bg-white text-gray-900">
      <main className="max-w-4xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold tracking-tight">AgentBoard</h1>
          <p className="text-gray-700 text-base max-w-2xl">
            Configure your AI voice agent, connect tools to public APIs, and review transcript history.
          </p>
        </div>

        <div className="flex gap-3 flex-col sm:flex-row">
          <a
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 text-sm sm:text-base h-11 px-5"
            href="/settings"
          >
            Agent Settings
          </a>
          <a
            className="inline-flex items-center justify-center rounded-md bg-gray-900 text-white hover:bg-gray-800 text-sm sm:text-base h-11 px-5"
            href="/chat"
          >
            Try the Agent
          </a>
          <a
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 text-sm sm:text-base h-11 px-5"
            href="/voice"
          >
            Voice Agent
          </a>
          <a
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 text-sm sm:text-base h-11 px-5"
            href="/transcripts"
          >
            Transcripts
          </a>
        </div>
      </main>
    </div>
  );
}
