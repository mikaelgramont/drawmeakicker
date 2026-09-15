import { beforeEach, describe, expect, it } from "vitest";
import type { Kicker } from "@/lib/kicker";
import { createDb, type Db } from "./client";
import { createKicker, loadKickerById, parseKickerId } from "./kickers";
import { kickers } from "./schema";

/*
 * Every boolean differs from at least one of its neighbours and none of the
 * numbers are equal, so a column swapped in the schema or in the migration
 * shows up as a failure rather than round-tripping by luck.
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

let db: Db;

beforeEach(() => {
  db = createDb(":memory:");
});

/** Counting rows is how "it did not insert again" is checked. */
function countRows(): number {
  return db.select().from(kickers).all().length;
}

describe("saving and loading", () => {
  it("round-trips every column", () => {
    const { id } = createKicker(kicker, { db });
    expect(loadKickerById(id, db)).toEqual({ id, kicker });
  });

  it("keeps a fractional exit angle", () => {
    // The legacy int(11) column and its IntValidator could not represent the
    // top of the slider's range.
    const { id } = createKicker({ ...kicker, angle: 89.9 }, { db });
    expect(loadKickerById(id, db)?.kicker.angle).toBe(89.9);
  });

  it("mints a new id per save rather than updating", () => {
    const first = createKicker(kicker, { db });
    const second = createKicker({ ...kicker, title: "Le petit" }, { db });

    expect(second.id).not.toBe(first.id);
    expect(loadKickerById(first.id, db)?.kicker.title).toBe("Le gros");
    expect(loadKickerById(second.id, db)?.kicker.title).toBe("Le petit");
  });

  it("reports an unknown id as missing", () => {
    expect(loadKickerById(404, db)).toBeNull();
  });
});

/*
 * The case these exist for: the outbox posts a design, the row commits, the
 * response is lost, and the outbox — which cannot tell that from a request
 * that never arrived — posts it again.
 */
describe("saving twice under one client key", () => {
  const key = "11111111-2222-3333-4444-555555555555";

  it("stores one row and returns it both times", () => {
    const first = createKicker(kicker, { clientKey: key, db });
    const second = createKicker(kicker, { clientKey: key, db });

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.id).toBe(first.id);
    expect(countRows()).toBe(1);
  });

  /*
   * The retry carries whatever the design looks like now, but the row is
   * already written and this is not an update path. Answering with the stored
   * kicker rather than the posted one keeps the client's record and the
   * server's row from disagreeing about what `?id=` will show.
   */
  it("answers a replay with the stored kicker, not the posted one", () => {
    const { id } = createKicker(kicker, { clientKey: key, db });
    const replay = createKicker({ ...kicker, title: "Renamed since" }, { clientKey: key, db });

    expect(replay.id).toBe(id);
    expect(replay.kicker.title).toBe("Le gros");
    expect(loadKickerById(id, db)?.kicker.title).toBe("Le gros");
  });

  it("does not leak the key into the kicker it returns", () => {
    const { kicker: stored } = createKicker(kicker, { clientKey: key, db });
    expect(stored).toEqual(kicker);
  });
});

describe("saving under different or absent keys", () => {
  it("keeps distinct keys apart", () => {
    const first = createKicker(kicker, { clientKey: "key-a", db });
    const second = createKicker(kicker, { clientKey: "key-b", db });

    expect(second.id).not.toBe(first.id);
    expect(countRows()).toBe(2);
  });

  /*
   * Rows written before the column existed have no key, and a client that
   * sends none has to keep working. SQLite counts each NULL as distinct, so
   * these do not collide with each other the way a naive unique index would
   * suggest.
   */
  it("still inserts every time with no key at all", () => {
    const first = createKicker(kicker, { db });
    const second = createKicker(kicker, { db });

    expect(second.id).not.toBe(first.id);
    expect(second.created).toBe(true);
    expect(countRows()).toBe(2);
  });

  it("does not let a keyed save collide with a keyless one", () => {
    createKicker(kicker, { db });
    const keyed = createKicker(kicker, { clientKey: "key-a", db });

    expect(keyed.created).toBe(true);
    expect(countRows()).toBe(2);
  });
});

describe("parsing ?id=", () => {
  it("accepts a positive integer", () => {
    expect(parseKickerId("42")).toBe(42);
  });

  it.each([
    ["absent", undefined],
    ["empty", ""],
    ["zero", "0"],
    ["negative", "-1"],
    ["fractional", "1.5"],
    ["not a number", "sixteen"],
    ["exponential", "1e3"],
    ["a SQL fragment", "1 OR 1=1"],
    ["beyond integer precision", "99999999999999999999"],
    ["repeated", ["1", "2"]],
  ])("treats %s as no id", (_label, value) => {
    expect(parseKickerId(value)).toBeNull();
  });
});
