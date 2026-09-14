import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { databasePath } from "./path";
import * as schema from "./schema";

export type Db = BetterSQLite3Database<typeof schema>;

const MIGRATIONS_FOLDER = resolve("drizzle");

/**
 * Opens a database and brings it up to date with ./drizzle.
 *
 * Migrating on open is safe to repeat: drizzle records what it has applied in
 * its own table, so this is a no-op once the file is current. It keeps the
 * deployment story to "copy the files and start", which is roughly what the
 * legacy app got from having its schema in bihi_kickers.sql.
 */
export function createDb(file: string = databasePath()): Db {
  if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });

  const sqlite = new Database(file);
  // Without this, a second writer gets SQLITE_BUSY instead of waiting.
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return db;
}

let cached: Db | undefined;

/**
 * The connection shared by route handlers and server components.
 *
 * SQLite connections are cheap but not free, and `next dev` re-evaluates
 * modules on edit, so this is memoized rather than opened per request.
 */
export function getDb(): Db {
  cached ??= createDb();
  return cached;
}
