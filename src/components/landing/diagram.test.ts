import { describe, expect, it } from "vitest";
import { calculateRadius, defaultKicker, kickerConfig, type Point2 } from "@/lib/kicker";
import { boundsOf, geometryFor, project, ridingLine, strutBoxes } from "./diagram";

const { height, angle } = defaultKicker;
const angleRad = (angle * Math.PI) / 180;

describe("bounds", () => {
  it("encloses the points", () => {
    const points: Point2[] = [
      [1, 2],
      [-3, 5],
      [4, -1],
    ];

    expect(boundsOf(points)).toEqual({ minX: -3, minY: -1, width: 7, height: 6 });
  });
});

describe("the projection", () => {
  const bounds = { minX: 0, minY: 0, width: 4, height: 2 };
  const canvas = { width: 200, height: 120 };
  const insets = { top: 10, right: 20, bottom: 30, left: 40 };
  const projection = project(bounds, canvas, insets);

  /*
   * The one thing that would quietly ruin every drawing: a different scale per
   * axis draws a ramp whose exit angle is not the angle it is labelled with.
   */
  it("uses one scale for both axes", () => {
    const acrossX = projection.x(1) - projection.x(0);
    const acrossY = projection.y(0) - projection.y(1);

    expect(acrossX).toBeCloseTo(acrossY);
  });

  it("puts the ground line on the bottom inset", () => {
    expect(projection.y(0)).toBeCloseTo(canvas.height - insets.bottom);
    expect(projection.groundY).toBeCloseTo(canvas.height - insets.bottom);
  });

  it("starts the drawing at the left inset", () => {
    expect(projection.x(0)).toBeCloseTo(insets.left);
  });

  it("fits inside the insets on whichever axis binds", () => {
    // 140 of usable width for 4 metres against 80 of usable height for 2, so
    // 35 per metre and 40: the width is what runs out first.
    expect(projection.scale).toBeCloseTo(35);
    expect(projection.x(bounds.width)).toBeLessThanOrEqual(canvas.width - insets.right);
    expect(projection.y(bounds.height)).toBeGreaterThanOrEqual(insets.top);
  });

  it("flips the y axis, because SVG counts downwards", () => {
    expect(projection.y(1)).toBeLessThan(projection.y(0));
  });

  it("writes a point as an SVG pair", () => {
    // One metre right of the left inset, one metre up from the ground line.
    expect(projection.at([1, 1])).toBe("75.00,55.00");
  });
});

describe("the riding line", () => {
  const geometry = geometryFor(height, angle);
  const line = ridingLine(geometry);

  it("runs from the toe to the lip", () => {
    const radius = calculateRadius(height, angle);

    expect(line[0][0]).toBeCloseTo(0);
    expect(line[0][1]).toBeCloseTo(0);
    expect(line[line.length - 1][0]).toBeCloseTo(radius * Math.sin(angleRad));
    expect(line[line.length - 1][1]).toBeCloseTo(height);
  });

  /*
   * It is taken as the first half of calculateSurfacePoints, which is the arc
   * followed by the same arc offset outwards. If that ever stops being a
   * there-and-back list the halving is wrong, and this is what would say so.
   */
  it("is half of the surface outline and rises the whole way", () => {
    expect(line).toHaveLength(geometry.surface.length / 2);

    for (let i = 1; i < line.length; i++) {
      expect(line[i][1]).toBeGreaterThan(line[i - 1][1]);
      expect(line[i][0]).toBeGreaterThan(line[i - 1][0]);
    }
  });
});

describe("strut boxes", () => {
  const geometry = geometryFor(height, angle);
  const radius = geometry.radius;
  const boxes = strutBoxes(geometry.struts, radius);

  it("produces one box per placement", () => {
    expect(boxes).toHaveLength(geometry.struts.length);
    expect(boxes.length).toBeGreaterThan(2);
  });

  /*
   * The property that makes a strut hold the deck up rather than float near
   * it: its centre sits half its own thickness below the arc, measured from
   * the arc's centre. This is the scene's placement (src/scene/parts/Struts)
   * restated as a fact about the result, so the drawing cannot drift from the
   * model while still looking plausible.
   */
  it("hangs every curve strut off the arc centre", () => {
    const curved = geometry.struts.flatMap((placement, index) =>
      placement.kind === "curve" ? [{ placement, box: boxes[index] }] : [],
    );
    expect(curved.length).toBeGreaterThan(0);

    for (const { placement, box } of curved) {
      const [cx, cy] = box.centre;
      const fromCentre = Math.hypot(cx - 0, cy - radius);

      expect(fromCentre).toBeCloseTo(radius + placement.thickness / 2);
      expect(box.angleRad).toBeCloseTo(placement.angleRad);
    }
  });

  it("leaves the base struts where the placement put them", () => {
    const base = geometry.struts.flatMap((placement, index) =>
      placement.kind === "base" ? [{ placement, box: boxes[index] }] : [],
    );
    expect(base).toHaveLength(2);

    for (const { placement, box } of base) {
      expect(box.centre).toEqual(placement.offset);
      expect(box.angleRad).toBe(0);
      expect(box.size).toBe(kickerConfig.struts.side);
    }
  });
});
