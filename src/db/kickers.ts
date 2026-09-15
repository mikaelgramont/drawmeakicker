import { eq } from "drizzle-orm";
import type { Kicker } from "@/lib/kicker";
import { getDb, type Db } from "./client";
import { kickers, type KickerRow } from "./schema";

/**
 * A stored kicker. The id is kept beside the kicker rather than inside it so
 * that `Kicker` stays exactly the shape the editor and `kickerSchema` use.
 */
export interface SavedKicker {
  id: number;
  kicker: Kicker;
}

/**
 * Replaces KickerDao in legacy/php/kickerdao.php.
 *
 * Validation lives in `kickerSchema` instead of the per-column validator
 * classes, so by the time anything gets here it is already a valid `Kicker`.
 * There is no update path, matching the original: saving always mints a new id,
 * which is why a loaded kicker is read-only until you press Modify.
 */

function toSavedKicker({ id, ...kicker }: KickerRow): SavedKicker {
  return { id, kicker };
}

export function createKicker(kicker: Kicker, db: Db = getDb()): SavedKicker {
  const row = db.insert(kickers).values(kicker).returning().get();
  return toSavedKicker(row);
}

export function loadKickerById(id: number, db: Db = getDb()): SavedKicker | null {
  const row = db.select().from(kickers).where(eq(kickers.id, id)).get();
  return row ? toSavedKicker(row) : null;
}

// Moved to @/lib/kicker-id so the browser can parse a shared link without
// pulling the database driver in with it. Re-exported because reading `?id=`
// still belongs to this module's job as far as its callers are concerned.
export { parseKickerId } from "@/lib/kicker-id";
