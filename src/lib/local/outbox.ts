/**
 * The outbox: gets locally saved designs to the server, eventually.
 *
 * Sync is push-only, because the server is anonymous and insert-only and so has
 * no notion of "my designs" to pull back. A design's whole reason for going out
 * is to be given a server id, which is the only thing a share link can be built
 * from.
 *
 * Everything here is written on the assumption that the server may be slow,
 * broken, lying, or absent, and that none of those may cost anyone a design.
 * The policy lives here; the transactional mechanics it relies on are in
 * ./designs.
 */
import { postKicker, type SaveOutcome } from "@/lib/kicker-api";
import {
  applySyncPatch,
  claimForSync,
  listSyncCandidates,
  type DesignsDb,
  type LocalDesign,
  type SyncPatch,
} from "./designs";

/**
 * How long a claim is honoured before another drain may take the record.
 * Comfortably longer than the request timeout in kicker-api, so a claim is only
 * ever reclaimed from a tab that actually went away.
 */
const LEASE_MS = 60_000;

/** Attempts before a design stops retrying and waits to be asked again. */
const MAX_ATTEMPTS = 8;

const BASE_BACKOFF_MS = 5_000;
const MAX_BACKOFF_MS = 10 * 60_000;

/** Web Locks name, so two tabs do not drain the same queue at once. */
const LOCK_NAME = "drawmeakicker-outbox";

/**
 * When to give up for now.
 *
 * Doubling from five seconds to a ten-minute ceiling. Persisted by the caller
 * as `nextAttemptAt` so a reload does not reset someone to hammering a server
 * that is already struggling.
 */
function backoffMs(attempts: number): number {
  return Math.min(BASE_BACKOFF_MS * 2 ** Math.max(0, attempts - 1), MAX_BACKOFF_MS);
}

/**
 * Translates an attempt into the bookkeeping to store.
 *
 * Note what is missing from the `saved` branch: the server echoes back the
 * kicker it stored, and this does not write it. The local copy is the source of
 * truth, and the echo is by definition what we just sent.
 */
export function patchFor(outcome: SaveOutcome, attempts: number, now: number): SyncPatch {
  switch (outcome.kind) {
    case "saved":
      return {
        serverId: outcome.result.id,
        share: outcome.result.share,
        syncState: "synced",
        error: null,
        attempts,
        claimedAt: null,
        nextAttemptAt: null,
      };

    case "rejected":
      // The server understood and refused, so retrying unchanged is pointless.
      // The design stays in the library and stays openable; `failed` is a label
      // on a usable design, not a tombstone.
      return {
        serverId: null,
        share: null,
        syncState: "failed",
        error: outcome.message,
        attempts,
        claimedAt: null,
        nextAttemptAt: null,
      };

    case "unavailable":
      return {
        serverId: null,
        share: null,
        // Out of attempts stops the retrying, not the design. It goes to
        // `failed` so the library can offer a manual retry rather than looping
        // every few seconds through an outage that lasts a week.
        syncState: attempts >= MAX_ATTEMPTS ? "failed" : "pending",
        error: outcome.message,
        attempts,
        claimedAt: null,
        nextAttemptAt: attempts >= MAX_ATTEMPTS ? null : now + backoffMs(attempts),
      };
  }
}

export interface DrainSummary {
  synced: number;
  rejected: number;
  deferred: number;
  /** True when another tab held the lock and this drain stood down. */
  skipped: boolean;
}

const NOTHING: DrainSummary = { synced: 0, rejected: 0, deferred: 0, skipped: false };

async function drainClaimed(db: DesignsDb | undefined): Promise<DrainSummary> {
  const summary: DrainSummary = { ...NOTHING };
  const candidates = await listSyncCandidates(Date.now(), LEASE_MS, db);

  for (const candidate of candidates) {
    const claimed = await claimForSync(candidate.localId, Date.now(), LEASE_MS, db);
    // Lost the race, or it was deleted between listing and claiming.
    if (!claimed) continue;

    /*
     * The local id doubles as the idempotency key. It is stable across every
     * attempt at this design and unique to it, which is exactly what the
     * server needs to recognise a retry of a save it already stored.
     */
    const outcome = await postKicker(claimed.kicker, { idempotencyKey: claimed.localId });
    const attempts = claimed.attempts + 1;
    await applySyncPatch(claimed.localId, patchFor(outcome, attempts, Date.now()), db);

    if (outcome.kind === "saved") summary.synced += 1;
    else if (outcome.kind === "rejected") summary.rejected += 1;
    else summary.deferred += 1;

    // An outage will fail every remaining design the same way. Stopping early
    // keeps one dead server from burning the attempt budget of the whole queue.
    if (outcome.kind === "unavailable") break;
  }

  return summary;
}

/**
 * Sends everything that is due.
 *
 * Takes the cross-tab lock if the browser has one, and stands down rather than
 * queueing when another tab already holds it: a second simultaneous drain would
 * only race for the same records, and duplicate posts are not free while the
 * endpoint inserts unconditionally.
 */
export async function drainOutbox(db?: DesignsDb): Promise<DrainSummary> {
  if (!navigator.locks) return drainClaimed(db);

  return navigator.locks.request(LOCK_NAME, { ifAvailable: true }, async (lock) => {
    if (!lock) return { ...NOTHING, skipped: true };
    return drainClaimed(db);
  }) as Promise<DrainSummary>;
}

/**
 * Drains now and whenever it is worth trying again.
 *
 * `online` is the obvious trigger but not a sufficient one: it reports that a
 * link came up, not that the server behind it is answering, and it never fires
 * for a server that was broken and got fixed. `visibilitychange` covers the
 * rest, since someone returning to the tab is the moment it matters.
 *
 * Returns a teardown function.
 */
export function startOutbox(onDrained?: (summary: DrainSummary) => void): () => void {
  let stopped = false;

  const run = () => {
    void drainOutbox().then((summary) => {
      if (!stopped) onDrained?.(summary);
    });
  };

  const onVisible = () => {
    if (document.visibilityState === "visible") run();
  };

  window.addEventListener("online", run);
  document.addEventListener("visibilitychange", onVisible);
  run();

  return () => {
    stopped = true;
    window.removeEventListener("online", run);
    document.removeEventListener("visibilitychange", onVisible);
  };
}
