import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native addon: it has to be required at runtime rather
  // than bundled, or the .node binding never makes it into the server build.
  serverExternalPackages: ["better-sqlite3"],
  // Don't generate AGENTS.md / CLAUDE.md into the repo root.
  agentRules: false,
};

export default nextConfig;
