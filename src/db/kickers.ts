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

/** A save, plus whether it actually wrote anything. */
export interface CreatedKicker extends SavedKicker {
  /**
   * False when the row was already there under the same client key.
   *
   * The caller needs this only to pick a status code; the row it gets back is
   * the same either way.
   */
  created: boolean;
}

/**
 * Replaces KickerDao in legacy/php/kickerdao.php.
 *
 * Validation lives in `kickerSchema` instead of the per-column validator
 * classes, so by the time anything gets here it is already a valid `Kicker`.
 * There is no update path, matching the original: saving always mints a new id,
 * which is why a loaded kicker is read-only until you press Modify.
 */

/**
 * `clientKey` is dropped rather than passed on. It is the client's own id for
 * the design and means nothing to anyone else, so it stays out of the `Kicker`
 * handed back — which is also what keeps that object exactly `kickerSchema`'s
 * shape now that the table has a column the schema does not.
 */
function toSavedKicker(row: KickerRow): SavedKicker {
  const { id, clientKey: _clientKey, ...kicker } = row;
  return { id, kicker };
}

/**
 * Stores a kicker, at most once per client key.
 *
 * Still insert-only: nothing here ever updates a row. What the key buys is
 * that a client which never heard our answer can ask again without minting a
 * second row. That is not a rare case — the outbox retries a save whose
 * response was lost, and it cannot tell that from one that never arrived.
 *
 * With no key the behaviour is the old one, an insert every time.
 */
export function createKicker(
  kicker: Kicker,
  { clientKey = null, db = getDb() }: { clientKey?: string | null; db?: Db } = {},
): CreatedKicker {
  if (clientKey === null) {
    return { ...toSavedKicker(db.insert(kickers).values(kicker).returning().get()), created: true };
  }

  /*
   * One statement rather than a look-then-insert, so two requests carrying the
   * same key cannot both find nothing and both insert. `onConflictDoNothing`
   * returns no rows when the key is taken, which is how the replay is spotted.
   */
  const inserted = db
    .insert(kickers)
    .values({ ...kicker, clientKey })
    .onConflictDoNothing({ target: kickers.clientKey })
    .returning()
    .get() as KickerRow | undefined;

  if (inserted) return { ...toSavedKicker(inserted), created: true };

  const existing = db.select().from(kickers).where(eq(kickers.clientKey, clientKey)).get();
  /*
   * The insert was refused, so a row with this key exists. If it cannot be
   * read back, something is wrong with the database rather than with the
   * request, and the route's 500 is the honest answer: the client will retry,
   * and the key means the retry still cannot duplicate anything.
   */
  if (!existing) throw new Error(`Key ${clientKey} conflicted but no row has it`);

  return { ...toSavedKicker(existing), created: false };
}

export function loadKickerById(id: number, db: Db = getDb()): SavedKicker | null {
  const row = db.select().from(kickers).where(eq(kickers.id, id)).get();
  return row ? toSavedKicker(row) : null;
}

// Moved to @/lib/kicker-id so the browser can parse a shared link without
// pulling the database driver in with it. Re-exported because reading `?id=`
// still belongs to this module's job as far as its callers are concerned.
export { parseKickerId } from "@/lib/kicker-id";
