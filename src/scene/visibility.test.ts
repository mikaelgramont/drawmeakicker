import { describe, expect, it } from "vitest";
import { defaultKicker, type Kicker, type RepresentationType } from "@/lib/kicker";
import { selectVisibility } from "./visibility";

const kicker = (patch: Partial<Kicker>): Kicker => ({ ...defaultKicker, ...patch });
const REP_TYPES: RepresentationType[] = ["2d", "3d"];

describe("selectVisibility", () => {
  it("never draws timber and outlines at the same time", () => {
    for (const repType of REP_TYPES) {
      for (const textured of [true, false]) {
        const { solid, outline } = selectVisibility(kicker({ repType, textured }));
        expect(solid).toBe(!outline);
      }
    }
  });

  it("only textures the 3D view", () => {
    expect(selectVisibility(kicker({ repType: "3d", textured: true })).solid).toBe(true);
    expect(selectVisibility(kicker({ repType: "3d", textured: false })).solid).toBe(false);
    // The textured toggle is inert in 2D, which is why its checkbox is disabled.
    expect(selectVisibility(kicker({ repType: "2d", textured: true })).solid).toBe(false);
  });

  it("draws thicker outlines in the flat view", () => {
    expect(selectVisibility(kicker({ repType: "2d" })).outlineWidth).toBe(2);
    expect(selectVisibility(kicker({ repType: "3d" })).outlineWidth).toBe(1);
  });

  it("keeps the grid and the board out of the 2D view", () => {
    for (const repType of REP_TYPES) {
      const visibility = selectVisibility(kicker({ repType, grid: true, mountainboard: true }));
      expect(visibility.grid).toBe(repType === "3d");
      expect(visibility.board).toBe(repType === "3d");
    }
  });

  it("respects the grid and board toggles when in 3D", () => {
    const off = selectVisibility(kicker({ repType: "3d", grid: false, mountainboard: false }));
    expect(off.grid).toBe(false);
    expect(off.board).toBe(false);
  });

  it("shows annotations in both views but the width one only in 3D", () => {
    for (const repType of REP_TYPES) {
      const on = selectVisibility(kicker({ repType, annotations: true }));
      expect(on.annotations).toBe(true);
      expect(on.widthAnnotation).toBe(repType === "3d");

      const off = selectVisibility(kicker({ repType, annotations: false }));
      expect(off.annotations).toBe(false);
      expect(off.widthAnnotation).toBe(false);
    }
  });
});
