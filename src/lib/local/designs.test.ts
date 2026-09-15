import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import type { Kicker } from "@/lib/kicker";
import {
  deleteDesign,
  getDesign,
  getDesignByServerId,
  listDesigns,
  openDesignsDb,
  saveDesign,
  type DesignsDb,
  type LocalDesign,
} from "./designs";

/*
 * Every boolean differs from at least one of its neighbours and none of the
 * numbers are equal, so a field swapped in the schema shows up as a failure
 * rather than round-tripping by luck. Same trick as src/db/kickers.test.ts.
 */
const kicker: Kicker = {
  height: 2.4,
  width: 1.5,
  angle: 89.9,

  repType: "3d",
  textured: false,

  annotations: false,
  grid: true,
  mountainboard: true,
  rider: false,

  fill: false,
  borders: true,

  title: "Le gros",
  description: "Steep, for tricks",
};

let db: DesignsDb;
let dbName = 0;

beforeEach(async () => {
  // A database per test: fake-indexeddb persists for the whole module run, so
  // sharing one would let records leak between cases.
  db = await openDesignsDb(`designs-test-${dbName++}`);
});

/** Writes a record straight past the schema, to stand in for stored rubbish. */
async function putRaw(record: unknown): Promise<void> {
  await db.put("designs" as never, record as never);
}

describe("saving and reading", () => {
  it("round-trips every field", async () => {
    const saved = await saveDesign(kicker, db);
    expect(await getDesign(saved.localId, db)).toEqual(saved);
  });

  it("stores a new design as pending, with no server identity yet", async () => {
    const saved = await saveDesign(kicker, db);

    expect(saved).toMatchObject({
      kicker,
      syncState: "pending",
      serverId: null,
      share: null,
      error: null,
      attempts: 0,
      claimedAt: null,
      nextAttemptAt: null,
    });
    expect(saved.localId).not.toHaveLength(0);
  });

  it("mints a new identity on every save, as the server does", async () => {
    const first = await saveDesign(kicker, db);
    const second = await saveDesign(kicker, db);

    expect(second.localId).not.toBe(first.localId);
    expect((await listDesigns(db)).designs).toHaveLength(2);
  });

  it("answers with null for a design that was never saved", async () => {
    expect(await getDesign("nobody", db)).toBeNull();
  });

  it("forgets a deleted design", async () => {
    const saved = await saveDesign(kicker, db);
    await deleteDesign(saved.localId, db);

    expect(await getDesign(saved.localId, db)).toBeNull();
    expect((await listDesigns(db)).designs).toHaveLength(0);
  });

  it("lists newest first", async () => {
    const older = await saveDesign({ ...kicker, title: "older" }, db);
    await db.put("designs", { ...older, savedAt: 1 });
    const newer = await saveDesign({ ...kicker, title: "newer" }, db);
    await db.put("designs", { ...newer, savedAt: 2 });

    expect((await listDesigns(db)).designs.map((d) => d.kicker.title)).toEqual([
      "newer",
      "older",
    ]);
  });
});

describe("a stored record that cannot be read", () => {
  /*
   * The point of the whole module: one bad row costs the user that row, not
   * their library. A half-finished write or something a future version stored
   * differently must not empty the list.
   */
  it("is skipped and counted, leaving the intact designs readable", async () => {
    const good = await saveDesign(kicker, db);
    await putRaw({ localId: "corrupt", kicker: { height: "not a number" } });

    const { designs, unreadable } = await listDesigns(db);

    expect(designs.map((d) => d.localId)).toEqual([good.localId]);
    expect(unreadable).toBe(1);
  });

  it("does not masquerade as a design when looked up directly", async () => {
    await putRaw({ localId: "corrupt", syncState: "pending" });
    expect(await getDesign("corrupt", db)).toBeNull();
  });
});

describe("designs outside the slider ranges", () => {
  /*
   * parameterRanges is a slider bound, not a storage constraint. Narrowing one
   * must not retroactively hide designs already saved under the wider bound,
   * so reads validate the shape and leave the ranges to the server.
   */
  it("stay readable, because reads check the shape and not the ranges", async () => {
    const saved = await saveDesign(kicker, db);
    await db.put("designs", { ...saved, kicker: { ...kicker, height: 99, angle: 0.5 } });

    const { designs, unreadable } = await listDesigns(db);

    expect(unreadable).toBe(0);
    expect(designs[0].kicker).toMatchObject({ height: 99, angle: 0.5 });
  });
});

describe("looking a design up by its server id", () => {
  it("finds one that has synced", async () => {
    const saved = await saveDesign(kicker, db);
    await db.put("designs", { ...saved, serverId: 42, syncState: "synced" });

    expect(await getDesignByServerId(42, db)).toMatchObject({
      localId: saved.localId,
      serverId: 42,
    });
  });

  it("answers with null when no design carries that id", async () => {
    await saveDesign(kicker, db);
    expect(await getDesignByServerId(42, db)).toBeNull();
  });

  /*
   * IndexedDB leaves a record out of an index when its key is null, which is
   * what keeps unsynced designs out of this lookup rather than having them
   * collide on a shared null key.
   */
  it("ignores designs that have not synced", async () => {
    await saveDesign(kicker, db);
    await saveDesign({ ...kicker, title: "another" }, db);

    expect(await db.countFromIndex("designs", "serverId")).toBe(0);
  });
});
