/**
 * Puts the app's own kicker geometry into 2D drawing coordinates.
 *
 * Drawings assembled through this module come from `@/lib/kicker` rather than
 * being pictures someone made once, for the same reason the PWA icons are
 * (scripts/make-icons.ts): a drawing of what the app produces, made by
 * anything other than the code that produces it, is a drawing that will
 * eventually be wrong. Change the default kicker or the strut spacing and
 * these follow.
 *
 * Nothing here touches three.js or React, so the same projection serves the
 * landing page (as server-rendered SVG) and the PDF export's side view.
 */
import {
  calculateRadius,
  calculateResults,
  calculateSidePoints,
  calculateStrutPlacements,
  calculateSurfacePoints,
  type KickerResults,
  type Point2,
  type StrutPlacement,
} from "@/lib/kicker";

/** A rectangle in model space: metres, y pointing up from the ground. */
export interface Bounds {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

export function boundsOf(points: readonly Point2[]): Bounds {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);

  return { minX, minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
}

/** Room left around the drawing, in SVG units, for annotations to live in. */
export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Canvas {
  width: number;
  height: number;
}

/**
 * Maps metres to SVG units.
 *
 * Two things it has to get right: SVG's y grows downwards where the model's
 * grows up, and the drawing has to sit on its ground line rather than float in
 * the middle of the box, because the dimension lines below it are measured
 * from there.
 */
export interface Projection {
  /** SVG units per metre. */
  readonly scale: number;
  /** Where model y = 0 ends up, which is the ground the ramp stands on. */
  readonly groundY: number;
  x(metres: number): number;
  y(metres: number): number;
  /** One point as the `x,y` pair an SVG points list wants. */
  at(point: Point2): string;
  /** A whole outline as a points list. */
  points(points: readonly Point2[]): string;
}

export function project(bounds: Bounds, canvas: Canvas, insets: Insets): Projection {
  const innerWidth = canvas.width - insets.left - insets.right;
  const innerHeight = canvas.height - insets.top - insets.bottom;
  // One scale for both axes: a ramp drawn with a stretched aspect ratio would
  // be a ramp whose exit angle is a lie.
  const scale = Math.min(innerWidth / bounds.width, innerHeight / bounds.height);

  const originX = insets.left - bounds.minX * scale;
  const groundY = canvas.height - insets.bottom + bounds.minY * scale;

  const x = (metres: number) => originX + metres * scale;
  const y = (metres: number) => groundY - metres * scale;
  const at = ([px, py]: Point2) => `${x(px).toFixed(2)},${y(py).toFixed(2)}`;

  return { scale, groundY, x, y, at, points: (list) => list.map(at).join(" ") };
}

/**
 * Everything one drawing needs about a kicker, derived once.
 *
 * `profile` is the plywood cheek the scene extrudes, and `surface` the riding
 * surface laid on it, both exactly as the editor draws them.
 */
export interface DiagramGeometry {
  height: number;
  angle: number;
  radius: number;
  results: KickerResults;
  profile: readonly Point2[];
  surface: readonly Point2[];
  struts: readonly StrutPlacement[];
}

export function geometryFor(height: number, angle: number): DiagramGeometry {
  const radius = calculateRadius(height, angle);
  const results = calculateResults(height, angle);

  return {
    height,
    angle,
    radius,
    results,
    profile: calculateSidePoints(angle, radius),
    surface: calculateSurfacePoints(angle, radius),
    struts: calculateStrutPlacements(angle, radius, results.arc, results.length),
  };
}

/**
 * Just the line you ride, without the thickness of the surface under it.
 *
 * `calculateSurfacePoints` lays the arc out and then returns along it offset
 * outwards by the surface thickness, so the first half of what it returns is
 * the arc itself. Taking it that way rather than re-sampling the arc here
 * keeps this at one remove from the geometry, with nothing to drift.
 */
export function ridingLine(geometry: DiagramGeometry): readonly Point2[] {
  return geometry.surface.slice(0, geometry.surface.length / 2);
}

/** A strut as something a `<rect>` can be placed and turned to match. */
export interface StrutBox {
  /** Centre, in model space. */
  centre: Point2;
  /** Side of the square section, in metres. */
  size: number;
  /** Rotation about its own centre, anticlockwise in model space. */
  angleRad: number;
}

/**
 * Where each strut sits.
 *
 * The curve struts are placed the way Struts.tsx places them — drop to the
 * arc's centre, turn, lift back — which is what leaves them square against
 * the underside of the deck instead of merely near it.
 */
export function strutBoxes(
  placements: readonly StrutPlacement[],
  radius: number,
): StrutBox[] {
  return placements.map((placement) => {
    if (placement.kind === "base") {
      return { centre: placement.offset, size: placement.thickness, angleRad: 0 };
    }

    const armLength = radius + placement.thickness / 2;
    return {
      centre: [
        armLength * Math.sin(placement.angleRad),
        radius - armLength * Math.cos(placement.angleRad),
      ],
      size: placement.thickness,
      angleRad: placement.angleRad,
    };
  });
}
