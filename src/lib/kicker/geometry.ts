/**
 * Kicker geometry, ported from legacy/public/scripts/kickermodel.js and the
 * strut placement loop in legacy/public/scripts/representation3d.js.
 *
 * Deliberately free of three.js: points are plain [x, y] pairs so this module
 * stays testable and can be reused for server-side validation in Phase 2.
 */
import { kickerConfig } from "./config";
import type { KickerResults } from "./types";

export type Point2 = readonly [x: number, y: number];

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/**
 * Radius of the transition arc that reaches `height` at `angleDeg`.
 *
 * A circle of radius r tangent to the ground rises by r(1 - cos a) after
 * turning through a, so r = h / (1 - cos a).
 */
export function calculateRadius(height: number, angleDeg: number): number {
  return height / (1 - Math.cos(toRadians(angleDeg)));
}

/** Ground footprint: the arc's horizontal reach plus room for the top strut. */
export function calculateLength(height: number, angleDeg: number): number {
  const angleRad = toRadians(angleDeg);
  return (
    (height * Math.sin(angleRad)) / (1 - Math.cos(angleRad)) + kickerConfig.sides.extraLength
  );
}

/** Arc length of the riding surface. */
export function calculateArc(radius: number, angleDeg: number): number {
  return radius * toRadians(angleDeg);
}

export function calculateResults(height: number, angleDeg: number): KickerResults {
  const radius = calculateRadius(height, angleDeg);
  return {
    radius,
    length: calculateLength(height, angleDeg),
    arc: calculateArc(radius, angleDeg),
  };
}

/**
 * Samples the transition arc from the ground up to `angleDeg`, dropping any
 * point below `minY` (the sides are not drawn where they'd be thinner than a
 * sheet of plywood).
 */
function sampleArc(minY: number, angleDeg: number, radius: number): Point2[] {
  const angleRad = toRadians(angleDeg);
  const { steps } = kickerConfig.sides;
  const points: Point2[] = [];

  for (let i = 0; i <= steps; i++) {
    const currentAngleRad = (i / steps) * angleRad;
    const y = radius * (1 - Math.cos(currentAngleRad));
    if (y < minY) continue;
    points.push([radius * Math.sin(currentAngleRad), y]);
  }

  return points;
}

/**
 * Closed outline of one side panel: up the arc, past the lip, then back down
 * to the ground. Extruded to `sides.thickness` to make the plywood cheek.
 */
export function calculateSidePoints(angleDeg: number, radius: number): Point2[] {
  const { minHeight, extraLength } = kickerConfig.sides;
  const arc = sampleArc(minHeight, angleDeg, radius);
  const last = arc[arc.length - 1];

  return [
    // Drop straight down from where the arc became thick enough to draw.
    [arc[0][0], 0],
    ...arc,
    // Extend past the lip so there is room for a strut at the top.
    [last[0] + extraLength, last[1]],
    [last[0] + extraLength, 0],
  ];
}

/**
 * Closed outline of the riding surface: along the arc, then back along the
 * same arc offset outwards by the surface thickness.
 */
export function calculateSurfacePoints(angleDeg: number, radius: number): Point2[] {
  const { thickness } = kickerConfig.surface;
  const inner = sampleArc(0, angleDeg, radius);
  const angleRad = toRadians(angleDeg);
  const points: Point2[] = [...inner];

  // The legacy version divided by inner.length here, which is steps + 1, so
  // the offset normal lagged the point it was offsetting. Using the same
  // denominator as sampleArc makes the offset properly perpendicular.
  const steps = inner.length - 1;

  for (let i = steps; i >= 0; i--) {
    const currentAngleRad = (i / steps) * angleRad;
    points.push([
      inner[i][0] - thickness * Math.sin(currentAngleRad),
      inner[i][1] + thickness * Math.cos(currentAngleRad),
    ]);
  }

  return points;
}

/**
 * A strut that follows the underside of the arc, placed by rotating a box
 * about the arc centre.
 */
export interface CurveStrut {
  kind: "curve";
  thickness: number;
  angleRad: number;
}

/** An axis-aligned strut sitting on the ground. */
export interface BaseStrut {
  kind: "base";
  thickness: number;
  offset: Point2;
}

export type StrutPlacement = CurveStrut | BaseStrut;

/**
 * Where the struts go. Struts are spaced at most `struts.maximumDistance`
 * apart along the arc, switch to a smaller section once the full one no longer
 * fits under the curve, and stop entirely when even that is too tall. Two more
 * sit on the ground: one under the lip, one two thirds of the way along.
 */
export function calculateStrutPlacements(
  angleDeg: number,
  radius: number,
  arc: number,
  length: number,
): StrutPlacement[] {
  const { side, smallSide, maximumDistance } = kickerConfig.struts;
  const placements: StrutPlacement[] = [];

  const strutsCount = Math.ceil(arc / maximumDistance);
  // Nudge each strut back so its leading face sits flush with the arc sample
  // rather than poking through it. Based on the full section width, as in the
  // original.
  const offsetAngleRad = side / (2 * radius);

  let thickness: number = side;
  for (let i = strutsCount; i > 0; i--) {
    const currentAngleRad = toRadians((angleDeg * i) / strutsCount) - offsetAngleRad;
    const y = radius * (1 - Math.cos(currentAngleRad));

    if (y < thickness) thickness = smallSide;
    if (y < thickness) break;

    placements.push({ kind: "curve", thickness, angleRad: currentAngleRad });
  }

  placements.push({ kind: "base", thickness: side, offset: [length - side, side] });
  placements.push({ kind: "base", thickness: side, offset: [(length * 2) / 3, side] });

  return placements;
}
