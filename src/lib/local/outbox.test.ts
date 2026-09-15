import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultKicker, type Kicker } from "@/lib/kicker";
import {
  getDesign,
  listSyncCandidates,
  openDesignsDb,
  saveDesign,
  updateDesignKicker,
  type DesignsDb,
  type LocalDesign,
} from "./designs";
import { drainOutbox } from "./outbox";

const share = {
  twitterUrl: "https://twitter.com/intent/tweet?url=x",
  facebookUrl: "https://www.facebook.com/sharer.php?u=x",
};

let db: DesignsDb;
let dbName = 0;

beforeEach(async () => {
  db = await openDesignsDb(`outbox-test-${dbName++}`);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

/** Stubs fetch with one canned reply, and records what it was asked. */
function stubFetch(reply: () => Promise<Response> | Response) {
  const calls: unknown[] = [];
  vi.stubGlobal("fetch", (_url: string, init?: RequestInit) => {
    calls.push(init?.body);
    return Promise.resolve(reply());
  });
  return calls;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function saved(kicker: Kicker, id = 7): Response {
  return json({ id, kicker, share }, 201);
}

async function stateOf(localId: string): Promise<LocalDesign> {
  const design = await getDesign(localId, db);
  if (!design) throw new Error("the design went missing");
  return design;
}

describe("a design the server accepts", () => {
  it("records the server id and share links", async () => {
    const design = await saveDesign(defaultKicker, db);
    stubFetch(() => saved(defaultKicker, 42));

    const summary = await drainOutbox(db);

    expect(summary).toMatchObject({ synced: 1, rejected: 0, deferred: 0 });
    expect(await stateOf(design.localId)).toMatchObject({
      syncState: "synced",
      serverId: 42,
      share,
      error: null,
      claimedAt: null,
      nextAttemptAt: null,
    });
  });

  it("is not attempted a second time", async () => {
    await saveDesign(defaultKicker, db);
    const calls = stubFetch(() => saved(defaultKicker));

    await drainOutbox(db);
    await drainOutbox(db);

    expect(calls).toHaveLength(1);
  });
});

describe("a design the server refuses", () => {
  it("is marked failed and left readable", async () => {
    const design = await saveDesign(defaultKicker, db);
    stubFetch(() => json({ errors: ["height: too big"] }, 400));

    const summary = await drainOutbox(db);

    expect(summary).toMatchObject({ rejected: 1 });
    expect(await stateOf(design.localId)).toMatchObject({
      syncState: "failed",
      error: "height: too big",
      serverId: null,
    });
    // The point: still there, still openable, kicker untouched.
    expect((await stateOf(design.localId)).kicker).toEqual(defaultKicker);
  });

  it("is not retried, because retrying it unchanged cannot help", async () => {
    await saveDesign(defaultKicker, db);
    const calls = stubFetch(() => json({ errors: ["nope"] }, 400));

    await drainOutbox(db);
    await drainOutbox(db);

    expect(calls).toHaveLength(1);
  });
});

/*
 * The cases that separate "offline" from "the server is having a bad day". Each
 * of these must leave the design queued rather than failed: a 500 is what the
 * route returns when the insert fails, so treating it as permanent would strand
 * a perfectly good design forever.
 */
describe("a server that cannot be trusted to answer properly", () => {
  const stays = async (reply: () => Promise<Response> | Response) => {
    const design = await saveDesign(defaultKicker, db);
    stubFetch(reply);

    const summary = await drainOutbox(db);
    const state = await stateOf(design.localId);

    expect(summary).toMatchObject({ deferred: 1, synced: 0, rejected: 0 });
    expect(state.syncState).toBe("pending");
    expect(state.serverId).toBeNull();
    expect(state.attempts).toBe(1);
    expect(state.nextAttemptAt).not.toBeNull();
    expect(state.claimedAt).toBeNull();
    return state;
  };

  it("leaves it queued on a 500", async () => {
    await stays(() => json({ errors: ["database is down"] }, 500));
  });

  it("leaves it queued on a proxy's 502 HTML", async () => {
    await stays(
      () => new Response("<html>502</html>", { status: 502, headers: { "content-type": "text/html" } }),
    );
  });

  it("leaves it queued when the connection fails outright", async () => {
    await stays(() => Promise.reject(new TypeError("Failed to fetch")) as never);
  });

  /*
   * A 2xx whose body does not validate is the dangerous one: the unchecked cast
   * this replaced would have stored `serverId: undefined` and marked the design
   * synced, leaving it permanently unshareable and never retried.
   */
  it("leaves it queued on a 201 with an empty body", async () => {
    await stays(() => new Response(null, { status: 201 }));
  });

  it("leaves it queued on a 201 carrying HTML", async () => {
    await stays(
      () =>
        new Response("<html>hello</html>", {
          status: 201,
          headers: { "content-type": "text/html" },
        }),
    );
  });

  it("leaves it queued on a 201 whose body has no id", async () => {
    await stays(() => json({ kicker: defaultKicker, share }, 201));
  });

  it("leaves it queued on a 201 whose id is not a number", async () => {
    await stays(() => json({ id: "seven", kicker: defaultKicker, share }, 201));
  });
});

describe("an edit made while a request is in flight", () => {
  /*
   * The regression test for the field-scoped write-back. The obvious
   * implementation puts back the record it was holding, which against a slow
   * server silently reverts whatever the user did in the meantime.
   */
  it("survives the write-back", async () => {
    const design = await saveDesign(defaultKicker, db);
    const edited: Kicker = { ...defaultKicker, height: 2.9, title: "edited mid-flight" };

    vi.stubGlobal("fetch", async () => {
      // Happens after the outbox has read the design and before it stores the
      // result, which is exactly the window that matters.
      await updateDesignKicker(design.localId, edited, db);
      return saved(defaultKicker);
    });

    await drainOutbox(db);
    const state = await stateOf(design.localId);

    expect(state.kicker).toEqual(edited);
    expect(state.syncState).toBe("synced");
    expect(state.serverId).toBe(7);
  });

  it("is what gets sent on the next attempt", async () => {
    const design = await saveDesign(defaultKicker, db);
    await updateDesignKicker(design.localId, { ...defaultKicker, height: 2.9 }, db);

    const calls = stubFetch(() => saved(defaultKicker));
    await drainOutbox(db);

    expect(JSON.parse(String(calls[0]))).toMatchObject({ height: 2.9 });
  });
});

describe("claims", () => {
  it("stop a second drain from posting the same design", async () => {
    await saveDesign(defaultKicker, db);
    let inFlight = 0;
    let overlapped = false;

    vi.stubGlobal("fetch", async () => {
      inFlight += 1;
      if (inFlight > 1) overlapped = true;
      await new Promise((resolve) => setTimeout(resolve, 20));
      inFlight -= 1;
      return saved(defaultKicker);
    });

    // navigator.locks is absent under jsdom-less vitest, so this exercises the
    // per-record claim rather than the cross-tab lock.
    await Promise.all([drainOutbox(db), drainOutbox(db)]);

    expect(overlapped).toBe(false);
    expect(await stateOf((await listAll())[0].localId)).toMatchObject({ syncState: "synced" });
  });

  it("are reclaimable once the lease has passed", async () => {
    const design = await saveDesign(defaultKicker, db);
    // A tab that died mid-request leaves the record like this.
    await db.put("designs", {
      ...design,
      syncState: "syncing",
      claimedAt: Date.now() - 10 * 60_000,
    });

    stubFetch(() => saved(defaultKicker));
    await drainOutbox(db);

    expect(await stateOf(design.localId)).toMatchObject({ syncState: "synced" });
  });

  it("are respected while the lease is still running", async () => {
    const design = await saveDesign(defaultKicker, db);
    await db.put("designs", { ...design, syncState: "syncing", claimedAt: Date.now() });

    const calls = stubFetch(() => saved(defaultKicker));
    await drainOutbox(db);

    expect(calls).toHaveLength(0);
    expect(await stateOf(design.localId)).toMatchObject({ syncState: "syncing" });
  });
});

describe("backoff", () => {
  it("holds a design back until its next attempt is due", async () => {
    const design = await saveDesign(defaultKicker, db);
    await db.put("designs", { ...design, nextAttemptAt: Date.now() + 60_000 });

    const calls = stubFetch(() => saved(defaultKicker));
    await drainOutbox(db);

    expect(calls).toHaveLength(0);
    expect(await listSyncCandidates(Date.now(), 60_000, db)).toHaveLength(0);
  });

  it("grows with each failure", async () => {
    const design = await saveDesign(defaultKicker, db);
    stubFetch(() => json({ errors: ["down"] }, 500));

    const waits: number[] = [];
    for (let i = 0; i < 3; i++) {
      const now = Date.now();
      await db.put("designs", { ...(await stateOf(design.localId)), nextAttemptAt: null });
      await drainOutbox(db);
      waits.push((await stateOf(design.localId)).nextAttemptAt! - now);
    }

    expect(waits[1]).toBeGreaterThan(waits[0]);
    expect(waits[2]).toBeGreaterThan(waits[1]);
  });

  it("gives up retrying after the attempt cap, without losing the design", async () => {
    const design = await saveDesign(defaultKicker, db);
    await db.put("designs", { ...design, attempts: 7 });
    stubFetch(() => json({ errors: ["down"] }, 500));

    await drainOutbox(db);
    const state = await stateOf(design.localId);

    expect(state).toMatchObject({ syncState: "failed", attempts: 8, nextAttemptAt: null });
    expect(state.kicker).toEqual(defaultKicker);
  });
});

describe("a queue of several designs", () => {
  it("stops at the first outage instead of burning everyone's attempts", async () => {
    await saveDesign({ ...defaultKicker, title: "one" }, db);
    await saveDesign({ ...defaultKicker, title: "two" }, db);
    await saveDesign({ ...defaultKicker, title: "three" }, db);

    const calls = stubFetch(() => json({ errors: ["down"] }, 500));
    const summary = await drainOutbox(db);

    expect(calls).toHaveLength(1);
    expect(summary).toMatchObject({ deferred: 1 });

    const untouched = (await listAll()).filter((d) => d.attempts === 0);
    expect(untouched).toHaveLength(2);
  });

  it("sends them in the order they were saved", async () => {
    const first = await saveDesign({ ...defaultKicker, title: "one" }, db);
    await db.put("designs", { ...first, savedAt: 1 });
    const second = await saveDesign({ ...defaultKicker, title: "two" }, db);
    await db.put("designs", { ...second, savedAt: 2 });

    const calls = stubFetch(() => saved(defaultKicker));
    await drainOutbox(db);

    expect(JSON.parse(String(calls[0])).title).toBe("one");
    expect(JSON.parse(String(calls[1])).title).toBe("two");
  });
});

async function listAll(): Promise<LocalDesign[]> {
  return db.getAll("designs");
}
