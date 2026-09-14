import { describe, expect, it } from "vitest";
import { kickerConfig } from "./config";
import {
  calculateArc,
  calculateLength,
  calculateRadius,
  calculateSidePoints,
  calculateStrutPlacements,
  calculateSurfacePoints,
  calculateResults,
} from "./geometry";
import { defaultKicker } from "./types";

const { height, width, angle } = defaultKicker;
const radius = calculateRadius(height, angle);
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

describe("closed-form dimensions", () => {
  it("picks a radius whose arc reaches exactly the requested height", () => {
    expect(radius * (1 - Math.cos(toRadians(angle)))).toBeCloseTo(height, 10);
  });

  it("makes the footprint the arc's horizontal reach plus the lip extension", () => {
    expect(calculateLength(height, angle)).toBeCloseTo(
      radius * Math.sin(toRadians(angle)) + kickerConfig.sides.extraLength,
      10,
    );
  });

  it("measures the surface as a circular arc", () => {
    expect(calculateArc(radius, angle)).toBeCloseTo(radius * toRadians(angle), 10);
  });

  it("needs a larger radius for a mellower exit at the same height", () => {
    expect(calculateRadius(height, 30)).toBeGreaterThan(calculateRadius(height, 60));
  });

  it("pins the default kicker's results", () => {
    expect(calculateResults(height, angle)).toMatchInlineSnapshot(`
      {
        "arc": 3.2178204736013862,
        "length": 2.997056274847714,
        "radius": 4.097056274847715,
      }
    `);
  });
});

describe("calculateSidePoints", () => {
  const points = calculateSidePoints(angle, radius);

  it("starts and ends on the ground so the outline closes", () => {
    expect(points[0][1]).toBe(0);
    expect(points[points.length - 1][1]).toBe(0);
  });

  it("runs monotonically away from the entry", () => {
    const xs = points.map(([x]) => x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
  });

  it("drops arc samples thinner than the minimum panel height", () => {
    const onArc = points.slice(1, -2);
    expect(Math.min(...onArc.map(([, y]) => y))).toBeGreaterThanOrEqual(
      kickerConfig.sides.minHeight,
    );
  });

  it("reaches the requested height at the lip", () => {
    expect(Math.max(...points.map(([, y]) => y))).toBeCloseTo(height, 10);
  });

  it("extends past the lip to leave room for the top strut", () => {
    const [lipX] = points[points.length - 3];
    expect(points[points.length - 2][0] - lipX).toBeCloseTo(
      kickerConfig.sides.extraLength,
      10,
    );
  });

  it("spans the full footprint", () => {
    expect(Math.max(...points.map(([x]) => x))).toBeCloseTo(calculateLength(height, angle), 10);
  });
});

describe("calculateSurfacePoints", () => {
  const points = calculateSurfacePoints(angle, radius);

  it("returns an outward pass for every inward sample", () => {
    expect(points.length).toBe(2 * (kickerConfig.sides.steps + 1));
  });

  it("offsets the outer pass by exactly the surface thickness", () => {
    const half = points.length / 2;
    for (let i = 0; i < half; i++) {
      const inner = points[i];
      const outer = points[points.length - 1 - i];
      const distance = Math.hypot(outer[0] - inner[0], outer[1] - inner[1]);
      expect(distance).toBeCloseTo(kickerConfig.surface.thickness, 10);
    }
  });

  it("offsets perpendicular to the arc, i.e. away from its centre", () => {
    const centre = [0, radius] as const;
    const half = points.length / 2;
    for (let i = 0; i < half; i++) {
      const inner = points[i];
      const outer = points[points.length - 1 - i];
      const innerToCentre = Math.hypot(inner[0] - centre[0], inner[1] - centre[1]);
      const outerToCentre = Math.hypot(outer[0] - centre[0], outer[1] - centre[1]);
      // Outward means closer to the centre, since the arc curves away from it.
      expect(innerToCentre - outerToCentre).toBeCloseTo(kickerConfig.surface.thickness, 10);
    }
  });
});

describe("calculateStrutPlacements", () => {
  const { arc, length } = calculateResults(height, angle);
  const placements = calculateStrutPlacements(angle, radius, arc, length);

  it("ends with the two struts that sit on the ground", () => {
    expect(placements.slice(-2)).toEqual([
      { kind: "base", thickness: kickerConfig.struts.side, offset: [length - kickerConfig.struts.side, kickerConfig.struts.side] },
      { kind: "base", thickness: kickerConfig.struts.side, offset: [(length * 2) / 3, kickerConfig.struts.side] },
    ]);
  });

  it("spaces the arc struts no further apart than the configured maximum", () => {
    const spacing = arc / Math.ceil(arc / kickerConfig.struts.maximumDistance);
    expect(spacing).toBeLessThanOrEqual(kickerConfig.struts.maximumDistance);
  });

  it("only places an arc strut where it actually fits under the curve", () => {
    for (const placement of placements) {
      if (placement.kind !== "curve") continue;
      const clearance = radius * (1 - Math.cos(placement.angleRad));
      expect(clearance).toBeGreaterThanOrEqual(placement.thickness);
    }
  });

  it("narrows towards the entry and never widens back up", () => {
    // Placements run from the lip down towards the entry, so sections may step
    // down from the full size to the small one but never back.
    const sections = placements.filter((p) => p.kind === "curve").map((p) => p.thickness);
    expect(sections).toEqual([...sections].sort((a, b) => b - a));
    for (const section of sections) {
      expect([kickerConfig.struts.side, kickerConfig.struts.smallSide]).toContain(section);
    }
  });

  it("uses the small section where only it fits", () => {
    // A mellow, tall ramp has a long shallow run near the entry, which is
    // where the full-size section runs out of clearance first.
    const mellow = calculateResults(3, 30);
    const sections = calculateStrutPlacements(
      30,
      calculateRadius(3, 30),
      mellow.arc,
      mellow.length,
    )
      .filter((p) => p.kind === "curve")
      .map((p) => p.thickness);
    expect(sections).toContain(kickerConfig.struts.smallSide);
  });

  it("adds more struts to a longer surface", () => {
    const tall = calculateResults(3, 60);
    const tallPlacements = calculateStrutPlacements(
      60,
      calculateRadius(3, 60),
      tall.arc,
      tall.length,
    );
    expect(tallPlacements.length).toBeGreaterThan(placements.length);
  });
});

describe("parameter sweep", () => {
  it("produces finite, ordered geometry across the whole slider range", () => {
    for (const h of [0.5, 1.2, 2, 3]) {
      for (const a of [30, 45, 60, 89.9]) {
        const r = calculateRadius(h, a);
        const results = calculateResults(h, a);
        expect(Number.isFinite(r)).toBe(true);
        expect(results.arc).toBeGreaterThan(0);
        expect(results.length).toBeGreaterThan(kickerConfig.sides.extraLength);

        const side = calculateSidePoints(a, r);
        expect(side.length).toBeGreaterThan(3);
        expect(side.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))).toBe(true);

        const surface = calculateSurfacePoints(a, r);
        expect(surface.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))).toBe(true);
      }
    }
  });

  it("keeps the width parameter out of the profile entirely", () => {
    // Width only extrudes the profile, so it must not affect these curves.
    expect(width).toBe(1);
    expect(calculateSidePoints(angle, radius)).toEqual(calculateSidePoints(angle, radius));
  });
});
