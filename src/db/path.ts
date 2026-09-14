import { resolve } from "node:path";

const DEFAULT_DATABASE_PATH = "data/kickers.db";

/**
 * Where the SQLite file lives. `KICKER_DB_PATH` overrides it, which is what
 * lets a deployment point at a mounted volume and what lets the tests ask for
 * ":memory:". Relative paths resolve against the working directory, which for
 * both `next dev` and `next start` is the project root.
 */
export function databasePath(): string {
  const configured = process.env.KICKER_DB_PATH;
  if (!configured) return resolve(DEFAULT_DATABASE_PATH);
  if (configured === ":memory:") return configured;
  return resolve(configured);
}
