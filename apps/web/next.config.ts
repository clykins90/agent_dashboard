import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const base = process.env.NEXT_PUBLIC_AGENT_API_URL;
    if (!base) return [];
    const dest = base.replace(/\/$/, "");
    return [
      {
        source: "/realtime/:path*",
        destination: `${dest}/realtime/:path*`,
      },
    ];
  },
};

export default nextConfig;


