import { describe, expect, it } from "vitest";
import { FRAME_COLUMNS, FRAME_NOTCH_LENGTH, FRAME_ROWS, frameNotches } from "./frame";

describe("frameNotches", () => {
  const width = 800;
  const height = 400;
  const notches = frameNotches(width, height);

  it("puts a notch at every internal boundary, top and bottom, left and right", () => {
    // Three column boundaries times two edges plus three row boundaries times
    // two edges: twelve in total.
    expect(FRAME_COLUMNS).toBe(4);
    expect(FRAME_ROWS).toBe(4);
    expect(notches).toHaveLength(2 * (FRAME_COLUMNS - 1) + 2 * (FRAME_ROWS - 1));
  });

  it("keeps every notch inside the frame", () => {
    for (const notch of notches) {
      for (const value of [notch.x1, notch.x2]) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(width);
      }
      for (const value of [notch.y1, notch.y2]) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(height);
      }
    }
  });

  it("makes every notch exactly the notch length long", () => {
    for (const notch of notches) {
      const length = Math.hypot(notch.x2 - notch.x1, notch.y2 - notch.y1);
      expect(length).toBeCloseTo(FRAME_NOTCH_LENGTH, 10);
    }
  });

  it("takes a shorter notch length for smaller drawings", () => {
    const shorter = frameNotches(width, height, 3);
    for (const notch of shorter) {
      expect(Math.hypot(notch.x2 - notch.x1, notch.y2 - notch.y1)).toBeCloseTo(3, 10);
    }
  });

  it("mirrors the notches on both edges of an axis", () => {
    // For every top notch there is a bottom notch at the same x, and for
    // every left notch a right notch at the same y.
    const tops = notches.filter((n) => n.y1 === 0);
    const bottoms = notches.filter((n) => n.y1 === height);
    expect(tops.map((n) => n.x1).sort()).toEqual(bottoms.map((n) => n.x1).sort());

    const lefts = notches.filter((n) => n.x1 === 0);
    const rights = notches.filter((n) => n.x1 === width);
    expect(lefts.map((n) => n.y1).sort()).toEqual(rights.map((n) => n.y1).sort());
  });
});
