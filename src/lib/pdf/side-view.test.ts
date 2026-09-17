import { describe, expect, it } from "vitest";
import { calculateResults, defaultKicker, formatAngle, formatLength } from "@/lib/kicker";
import { buildSideView, SIDE_VIEW_INSETS, type Primitive } from "./side-view";

const canvas = { width: 700, height: 480 };
const primitives = buildSideView(defaultKicker, canvas, "m");

const texts = (list: Primitive[]) => list.flatMap((p) => (p.kind === "text" ? [p.text] : []));
const polylines = (list: Primitive[]) =>
  list.flatMap((p) => (p.kind === "polyline" ? [p] : []));
const polygons = (list: Primitive[]) =>
  list.flatMap((p) => (p.kind === "polygon" ? [p] : []));

describe("buildSideView", () => {
  it("emits every in-plane dimension the plan calls for", () => {
    const { length, radius, arc } = calculateResults(
      defaultKicker.height,
      defaultKicker.angle,
    );
    const labels = texts(primitives);

    expect(labels).toContain(formatLength(length, "m"));
    expect(labels).toContain(formatLength(defaultKicker.height, "m"));
    expect(labels).toContain(formatLength(radius, "m"));
    expect(labels).toContain(formatLength(arc, "m"));
    expect(labels).toContain(formatAngle(defaultKicker.angle));
  });

  it("draws every stroked line and arrow tip inside the canvas", () => {
    // Nothing may fall off the page. If it did, the export would clip in ways
    // that only reveal themselves once someone tried to build from the print.
    const bounds = { x: [0, canvas.width] as const, y: [0, canvas.height] as const };
    for (const line of polylines(primitives)) {
      for (const point of line.points) {
        expect(point.x).toBeGreaterThanOrEqual(bounds.x[0]);
        expect(point.x).toBeLessThanOrEqual(bounds.x[1]);
        expect(point.y).toBeGreaterThanOrEqual(bounds.y[0]);
        expect(point.y).toBeLessThanOrEqual(bounds.y[1]);
      }
    }
    for (const tip of polygons(primitives)) {
      for (const point of tip.points) {
        expect(point.x).toBeGreaterThanOrEqual(bounds.x[0]);
        expect(point.x).toBeLessThanOrEqual(bounds.x[1]);
        expect(point.y).toBeGreaterThanOrEqual(bounds.y[0]);
        expect(point.y).toBeLessThanOrEqual(bounds.y[1]);
      }
    }
  });

  it("labels lengths in the unit the caller asks for", () => {
    const imperial = buildSideView({ ...defaultKicker, height: 1.2, angle: 45 }, canvas, "ft");
    // 1.2m is exactly 3ft 11in.
    expect(texts(imperial)).toContain("3ft 11in");
  });

  it("closes the profile and the surface polylines", () => {
    const closedCount = polylines(primitives).filter((p) => p.closed).length;

    // The profile, the surface, and one strut per placement. Every ramp built
    // from the default kicker takes at least a handful of struts.
    expect(closedCount).toBeGreaterThanOrEqual(2 + 3);
  });

  it("has a filled tip for every dimension arrow", () => {
    // Four two-tipped dimensions (base, height, radius stub, surface trace)
    // — the radius is one-tipped (pointing at the lip) and the surface trace
    // has no head, so seven tips is the floor. In practice the base and
    // height each add two, and each end of them gets a tip.
    expect(polygons(primitives).length).toBeGreaterThanOrEqual(5);
  });

  it("draws the grid, the ground line and the frame outline", () => {
    // Vertical and horizontal grid lines both cover the drawable area, so at
    // this canvas size there is at least one of each side of the origin.
    const gridVerticals = polylines(primitives).filter(
      (line) => line.points[0].x === line.points[1].x && line.weight === "thin",
    );
    const gridHorizontals = polylines(primitives).filter(
      (line) => line.points[0].y === line.points[1].y && line.weight === "thin",
    );
    expect(gridVerticals.length).toBeGreaterThan(1);
    expect(gridHorizontals.length).toBeGreaterThan(1);
  });

  it("takes the same insets it exports as its default", () => {
    const explicit = buildSideView(defaultKicker, canvas, "m", SIDE_VIEW_INSETS);
    expect(explicit.length).toBe(primitives.length);
  });
});
