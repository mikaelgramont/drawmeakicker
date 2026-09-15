import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { defaultKicker } from "@/lib/kicker";
import { listDesigns, openDesignsDb, saveDesign, type DesignsDb } from "./designs";
import { exportLibrary, importLibrary, NOT_A_LIBRARY } from "./transfer";

const share = {
  twitterUrl: "https://twitter.com/intent/tweet?url=x",
  facebookUrl: "https://www.facebook.com/sharer.php?u=x",
};

let db: DesignsDb;
let into: DesignsDb;
let dbName = 0;

beforeEach(async () => {
  db = await openDesignsDb(`transfer-out-${dbName}`);
  into = await openDesignsDb(`transfer-in-${dbName++}`);
});

describe("exporting", () => {
  it("writes a readable envelope with every design in it", async () => {
    await saveDesign({ ...defaultKicker, title: "one" }, db);
    await saveDesign({ ...defaultKicker, title: "two" }, db);

    const file = JSON.parse(await exportLibrary(db));

    expect(file).toMatchObject({ format: "drawmeakicker-library", version: 1 });
    expect(file.designs.map((d: { kicker: { title: string } }) => d.kicker.title).sort()).toEqual([
      "one",
      "two",
    ]);
  });

  it("works with nothing saved", async () => {
    expect(JSON.parse(await exportLibrary(db)).designs).toEqual([]);
  });
});

describe("importing", () => {
  it("round-trips a library into another device", async () => {
    const original = await saveDesign({ ...defaultKicker, title: "one" }, db);
    const file = await exportLibrary(db);

    const summary = await importLibrary(file, into);
    const { designs } = await listDesigns(into);

    expect(summary).toMatchObject({ imported: 1, skipped: 0, unreadable: 0 });
    expect(designs[0].kicker).toEqual(original.kicker);
  });

  /*
   * A fresh handle rather than the exported one, so importing can never
   * overwrite a record already on this device.
   */
  it("gives imported designs new local handles", async () => {
    const original = await saveDesign(defaultKicker, db);
    await importLibrary(await exportLibrary(db), into);

    const { designs } = await listDesigns(into);
    expect(designs[0].localId).not.toBe(original.localId);
  });

  it("keeps the sync state, so synced designs are not queued again", async () => {
    const original = await saveDesign(defaultKicker, db);
    await db.put("designs", { ...original, serverId: 9, share, syncState: "synced" });

    await importLibrary(await exportLibrary(db), into);
    const { designs } = await listDesigns(into);

    expect(designs[0]).toMatchObject({ syncState: "synced", serverId: 9, share });
  });

  it("adds to the library rather than replacing it", async () => {
    await saveDesign({ ...defaultKicker, title: "already here" }, into);
    await saveDesign({ ...defaultKicker, title: "incoming" }, db);

    await importLibrary(await exportLibrary(db), into);
    const titles = (await listDesigns(into)).designs.map((d) => d.kicker.title).sort();

    expect(titles).toEqual(["already here", "incoming"]);
  });

  it("skips designs the server already knows by the same id", async () => {
    const original = await saveDesign(defaultKicker, db);
    await db.put("designs", { ...original, serverId: 9, share, syncState: "synced" });
    const file = await exportLibrary(db);

    await importLibrary(file, into);
    const summary = await importLibrary(file, into);

    expect(summary).toMatchObject({ imported: 0, skipped: 1 });
    expect((await listDesigns(into)).designs).toHaveLength(1);
  });

  it("imports what it can and counts what it cannot", async () => {
    const good = await saveDesign({ ...defaultKicker, title: "good" }, db);
    const file = JSON.parse(await exportLibrary(db));
    file.designs.push({ localId: "bad", kicker: { height: "tall" } });

    const summary = await importLibrary(JSON.stringify(file), into);

    expect(summary).toMatchObject({ imported: 1, unreadable: 1 });
    expect((await listDesigns(into)).designs[0].kicker.title).toBe(good.kicker.title);
  });

  it("refuses something that is not a library", async () => {
    await expect(importLibrary("{}", into)).rejects.toThrow(NOT_A_LIBRARY);
    await expect(importLibrary("not json at all", into)).rejects.toThrow(NOT_A_LIBRARY);
    await expect(
      importLibrary(JSON.stringify({ format: "something-else", version: 1 }), into),
    ).rejects.toThrow(NOT_A_LIBRARY);
  });
});
