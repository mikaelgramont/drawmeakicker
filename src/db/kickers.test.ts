import { beforeEach, describe, expect, it } from "vitest";
import type { Kicker } from "@/lib/kicker";
import { createDb, type Db } from "./client";
import { createKicker, loadKickerById, parseKickerId } from "./kickers";

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

describe("saving and loading", () => {
  it("round-trips every column", () => {
    const { id } = createKicker(kicker, db);
    expect(loadKickerById(id, db)).toEqual({ id, kicker });
  });

  it("keeps a fractional exit angle", () => {
    // The legacy int(11) column and its IntValidator could not represent the
    // top of the slider's range.
    const { id } = createKicker({ ...kicker, angle: 89.9 }, db);
    expect(loadKickerById(id, db)?.kicker.angle).toBe(89.9);
  });

  it("mints a new id per save rather than updating", () => {
    const first = createKicker(kicker, db);
    const second = createKicker({ ...kicker, title: "Le petit" }, db);

    expect(second.id).not.toBe(first.id);
    expect(loadKickerById(first.id, db)?.kicker.title).toBe("Le gros");
    expect(loadKickerById(second.id, db)?.kicker.title).toBe("Le petit");
  });

  it("reports an unknown id as missing", () => {
    expect(loadKickerById(404, db)).toBeNull();
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
