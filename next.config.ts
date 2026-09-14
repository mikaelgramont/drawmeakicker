import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Phase 1 is a purely static frontend: no server, no database.
  // Phase 2 drops this to enable route handlers and SQLite.
  output: "export",
  images: { unoptimized: true },
  // Don't generate AGENTS.md / CLAUDE.md into the repo root.
  agentRules: false,
};

export default nextConfig;
