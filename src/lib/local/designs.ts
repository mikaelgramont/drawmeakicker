/**
 * The local library: every design the user has saved, on this device.
 *
 * This is the source of truth. The server is a place designs are *also* sent,
 * so that they can be shared, and it is allowed to be unreachable, slow or
 * broken without any of that costing someone their work. Reads here therefore
 * never depend on the network, and nothing a sync learns is allowed to make a
 * design unreadable.
 *
 * Mirrors the shape of src/db, deliberately: one record type, insert and read,
 * and a handle that callers may pass in so tests can work against a database of
 * their own.
 */
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { z } from "zod";
import { REPRESENTATION_TYPES, type Kicker } from "@/lib/kicker";
import type { ShareLinks } from "@/lib/share";

const DATABASE_NAME = "drawmeakicker";
const DATABASE_VERSION = 1;
const STORE = "designs";

/**
 * Where a design has got to on its way to the server.
 *
 * `failed` is a label, not a tombstone: the design stays in the library and
 * stays openable. It only means the server rejected it outright, so retrying
 * cannot help without an edit.
 */
export const SYNC_STATES = ["pending", "syncing", "synced", "failed"] as const;
export type SyncState = (typeof SYNC_STATES)[number];

export interface LocalDesign {
  /** Stable local handle, independent of whether the server ever sees this. */
  localId: string;
  kicker: Kicker;
  /** The id this design is shareable at, or null until it has synced. */
  serverId: number | null;
  share: ShareLinks | null;
  syncState: SyncState;
  savedAt: number;
  /** Why the last sync attempt failed, for the library to show. */
  error: string | null;
  attempts: number;
  /**
   * When a drain claimed this record. A claim carries a time so that one
   * abandoned by a closed tab can be taken over rather than stranding the
   * design in `syncing` forever.
   */
  claimedAt: number | null;
  /** Earliest time the next attempt may run, so backoff survives a reload. */
  nextAttemptAt: number | null;
}

/**
 * The stored kicker, validated structurally rather than against the slider
 * ranges in `parameterRanges`.
 *
 * This is the whole point: `kickerSchema` enforces the ranges, so validating
 * reads with it would mean that narrowing a slider retroactively made designs
 * already on disk unreadable. Someone would lose work to a change in a
 * constant. The ranges still apply on the way to the server, where
 * `kickerSchema` runs and a violation is a permanent, reportable failure.
 *
 * The annotation is what keeps this honest: typing it as `ZodType<Kicker>`
 * means adding, renaming or retyping a field on `Kicker` fails to compile here
 * rather than silently dropping that field from every future read.
 */
const storedKickerSchema: z.ZodType<Kicker> = z.object({
  height: z.number(),
  width: z.number(),
  angle: z.number(),

  repType: z.enum(REPRESENTATION_TYPES),
  textured: z.boolean(),

  annotations: z.boolean(),
  grid: z.boolean(),
  mountainboard: z.boolean(),
  rider: z.boolean(),

  fill: z.boolean(),
  borders: z.boolean(),

  title: z.string(),
  description: z.string(),
});

const shareLinksSchema: z.ZodType<ShareLinks> = z.object({
  twitterUrl: z.string(),
  facebookUrl: z.string(),
});

/** Exported so an import can validate entries from a file the same way. */
export const localDesignSchema: z.ZodType<LocalDesign> = z.object({
  localId: z.string().min(1),
  kicker: storedKickerSchema,
  serverId: z.number().int().positive().nullable(),
  share: shareLinksSchema.nullable(),
  syncState: z.enum(SYNC_STATES),
  savedAt: z.number(),
  error: z.string().nullable(),
  attempts: z.number().int().min(0),
  claimedAt: z.number().nullable(),
  nextAttemptAt: z.number().nullable(),
});

interface DesignsSchema extends DBSchema {
  [STORE]: {
    key: string;
    value: LocalDesign;
    indexes: {
      /** Every record; how the outbox finds work. */
      syncState: SyncState;
      /**
       * Only synced records. IndexedDB leaves a record out of an index when its
       * key is null, which is exactly what we want: this index is the lookup
       * for a shared `?id=` link opened without a server to answer it.
       */
      serverId: number;
    };
  };
}

export type DesignsDb = IDBPDatabase<DesignsSchema>;

export const OUT_OF_SPACE = "There is no room left on this device to save the design.";
export const SAVE_FAILED = "The design could not be saved on this device.";
export const OPEN_FAILED = "The library of saved designs on this device could not be opened.";

/**
 * Opens the library, creating or upgrading it as needed.
 *
 * Upgrades must only ever add. A migration that rewrote or dropped a store
 * could throw partway and leave the database in a state where every subsequent
 * open fails, which would take the whole library with it; the version guard
 * keeps each step append-only and skippable.
 */
export function openDesignsDb(name: string = DATABASE_NAME): Promise<DesignsDb> {
  return openDB<DesignsSchema>(name, DATABASE_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const store = db.createObjectStore(STORE, { keyPath: "localId" });
        store.createIndex("syncState", "syncState");
        store.createIndex("serverId", "serverId");
      }
    },
  });
}

let cached: Promise<DesignsDb> | undefined;

/** The handle shared by the editor and the outbox. */
export function getDesignsDb(): Promise<DesignsDb> {
  cached ??= openDesignsDb().catch((error: unknown) => {
    // Don't memoize a failure: a later attempt may well succeed, and the
    // alternative is one transient error disabling saving for the session.
    cached = undefined;
    console.error("Could not open the local design library", error);
    throw new Error(OPEN_FAILED);
  });
  return cached;
}

async function handle(db: DesignsDb | undefined): Promise<DesignsDb> {
  return db ?? (await getDesignsDb());
}

/**
 * Asks the browser to stop treating the library as disposable.
 *
 * Storage is evictable under pressure by default, which for an offline-first
 * app means the one copy of someone's work could be reclaimed to make room for
 * a cache. Installed apps are usually granted this without a prompt. Returns
 * whether the origin is persisted, and never throws: it is an improvement, not
 * a requirement.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

function isQuotaExceeded(error: unknown): boolean {
  return error instanceof DOMException && error.name === "QuotaExceededError";
}

/** Runs a write, turning a full disk into something worth showing a user. */
async function write<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (isQuotaExceeded(error)) throw new Error(OUT_OF_SPACE);
    console.error("A local design write failed", error);
    throw new Error(SAVE_FAILED);
  }
}

/**
 * Stores a kicker as a new design, queued for the server.
 *
 * Always an insert, which is both what the server does and what the editor's
 * mode machine already expects: saving mints a new identity rather than
 * revising an existing one.
 */
export async function saveDesign(kicker: Kicker, db?: DesignsDb): Promise<LocalDesign> {
  const design: LocalDesign = {
    localId: crypto.randomUUID(),
    kicker,
    serverId: null,
    share: null,
    syncState: "pending",
    savedAt: Date.now(),
    error: null,
    attempts: 0,
    claimedAt: null,
    nextAttemptAt: null,
  };

  const database = await handle(db);
  await write(() => database.put(STORE, design));
  return design;
}

/**
 * Stores a design as-is, keeping its local handle and sync state.
 *
 * Only for an import restoring records that already exist somewhere. Saving
 * from the editor goes through `saveDesign`, which mints the identity.
 */
export async function putDesign(design: LocalDesign, db?: DesignsDb): Promise<void> {
  const database = await handle(db);
  await write(() => database.put(STORE, design));
}

export interface DesignList {
  /** Newest first. */
  designs: LocalDesign[];
  /**
   * How many stored records could not be read. Reported rather than thrown so
   * the library still shows everything that is intact.
   */
  unreadable: number;
}

/**
 * Every design that can be read.
 *
 * Validated one record at a time on purpose. Parsing the list as a whole would
 * mean a single corrupt row — a half-finished write, something a future version
 * wrote differently — emptying the entire library, which is the exact failure
 * this module exists to prevent.
 */
export async function listDesigns(db?: DesignsDb): Promise<DesignList> {
  const database = await handle(db);
  const stored = await database.getAll(STORE);

  const designs: LocalDesign[] = [];
  let unreadable = 0;

  for (const record of stored) {
    const parsed = localDesignSchema.safeParse(record);
    if (parsed.success) designs.push(parsed.data);
    else unreadable += 1;
  }

  // Sorted here rather than by an index: a personal library is tens of records,
  // and this keeps the ordering next to the filtering that produced the list.
  designs.sort((a, b) => b.savedAt - a.savedAt);

  return { designs, unreadable };
}

function readOne(record: LocalDesign | undefined): LocalDesign | null {
  if (!record) return null;
  const parsed = localDesignSchema.safeParse(record);
  return parsed.success ? parsed.data : null;
}

export async function getDesign(localId: string, db?: DesignsDb): Promise<LocalDesign | null> {
  const database = await handle(db);
  return readOne(await database.get(STORE, localId));
}

/**
 * The design a shared `?id=` link points at, if this device happens to have it.
 *
 * What makes a shared link still work when the server that minted it cannot be
 * reached.
 */
export async function getDesignByServerId(
  serverId: number,
  db?: DesignsDb,
): Promise<LocalDesign | null> {
  const database = await handle(db);
  return readOne(await database.getFromIndex(STORE, "serverId", serverId));
}

export async function deleteDesign(localId: string, db?: DesignsDb): Promise<void> {
  const database = await handle(db);
  await write(() => database.delete(STORE, localId));
}

/**
 * The bookkeeping a sync may write back.
 *
 * `kicker` and `savedAt` are deliberately absent, which is what makes "a sync
 * cannot damage a design" a property of the types rather than a promise about
 * the code. Nothing in the app revises a stored kicker today — editing a saved
 * design calls `startDerivative` and saves a new record — but the outbox reads
 * a design, goes to the network, and writes back much later, so anything that
 * did would be racing it.
 */
export type SyncPatch = Pick<
  LocalDesign,
  "serverId" | "share" | "syncState" | "error" | "attempts" | "claimedAt" | "nextAttemptAt"
>;

/** Whether a record is free to be picked up, given a claim lease. */
function isClaimable(record: LocalDesign, now: number, leaseMs: number): boolean {
  if (record.syncState === "pending") {
    return record.nextAttemptAt === null || record.nextAttemptAt <= now;
  }
  // A claim older than the lease belonged to a tab that went away mid-request.
  // Without this, a design stranded in `syncing` would never be looked at again.
  if (record.syncState === "syncing") {
    return record.claimedAt === null || record.claimedAt + leaseMs <= now;
  }
  return false;
}

/**
 * Designs worth attempting, newest last so the queue drains in save order.
 *
 * Unreadable records are left out rather than skipped silently later: there is
 * no sense posting something we cannot validate.
 */
export async function listSyncCandidates(
  now: number,
  leaseMs: number,
  db?: DesignsDb,
): Promise<LocalDesign[]> {
  const database = await handle(db);
  const stored = [
    ...(await database.getAllFromIndex(STORE, "syncState", "pending")),
    ...(await database.getAllFromIndex(STORE, "syncState", "syncing")),
  ];

  return stored
    .map((record) => localDesignSchema.safeParse(record))
    .filter((parsed) => parsed.success)
    .map((parsed) => parsed.data)
    .filter((record) => isClaimable(record, now, leaseMs))
    .sort((a, b) => a.savedAt - b.savedAt);
}

/**
 * Takes ownership of a design for the duration of one attempt.
 *
 * Transactional, so that of two drains racing for the same record exactly one
 * wins and the other sees it already `syncing`. Answers null when the record is
 * gone or somebody else got there first.
 */
export async function claimForSync(
  localId: string,
  now: number,
  leaseMs: number,
  db?: DesignsDb,
): Promise<LocalDesign | null> {
  const database = await handle(db);
  const tx = database.transaction(STORE, "readwrite");
  const current = await tx.store.get(localId);

  if (!current || !isClaimable(current, now, leaseMs)) {
    await tx.done;
    return null;
  }

  const claimed: LocalDesign = { ...current, syncState: "syncing", claimedAt: now };
  await tx.store.put(claimed);
  await tx.done;
  return claimed;
}

/**
 * Records what a sync attempt learned, and nothing else.
 *
 * The re-read inside the transaction is the whole point. Writing the record the
 * caller was holding would revert any edit made while the request was in
 * flight, and against a slow server that window is arbitrarily long. Spreading
 * a narrow patch over a freshly read record keeps the user's kicker whatever
 * they last made it.
 */
export async function applySyncPatch(
  localId: string,
  patch: SyncPatch,
  db?: DesignsDb,
): Promise<void> {
  const database = await handle(db);
  await write(async () => {
    const tx = database.transaction(STORE, "readwrite");
    const current = await tx.store.get(localId);
    if (current) await tx.store.put({ ...current, ...patch });
    await tx.done;
  });
}

/**
 * Puts a design back in the queue, clearing whatever stopped it.
 *
 * What the library's retry offers. Resetting `attempts` is the point: a design
 * that ran out of attempts during a week-long outage is not broken, and the
 * only way back from the cap is for someone to ask.
 *
 * Refuses to touch a design that already synced, so a stray retry cannot strip
 * an id and share links that are perfectly good.
 */
export async function retryDesign(localId: string, db?: DesignsDb): Promise<void> {
  const database = await handle(db);
  const current = await getDesign(localId, database);
  if (!current || current.syncState === "synced") return;

  await applySyncPatch(
    localId,
    {
      serverId: null,
      share: null,
      syncState: "pending",
      error: null,
      attempts: 0,
      claimedAt: null,
      nextAttemptAt: null,
    },
    database,
  );
}

/** How many designs are still waiting on the server, for the status chip. */
export async function countUnsynced(db?: DesignsDb): Promise<number> {
  const database = await handle(db);
  const pending = await database.countFromIndex(STORE, "syncState", "pending");
  const syncing = await database.countFromIndex(STORE, "syncState", "syncing");
  return pending + syncing;
}
