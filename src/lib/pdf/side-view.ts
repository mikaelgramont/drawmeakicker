/**
 * The 2D side view for page two of the PDF, expressed as a flat list of
 * drawing primitives.
 *
 * Nothing here calls into jsPDF: the module takes a projection built from the
 * ramp's own geometry (`@/lib/drawing/project`) and emits polylines, filled
 * arrow tips and text placements in output-space coordinates. The PDF writer
 * consumes them; the same list could be turned into SVG or Canvas without
 * change. That is what keeps this testable and what keeps it in step with the
 * editor's own side view: both draw from the same `calculateSidePoints` and
 * `calculateStrutPlacements`.
 *
 * The vocabulary is deliberately narrow. Curves are flattened into polylines
 * (the arc is already sampled that way by the geometry module), which spares
 * both this and its consumer a Bezier primitive to argue about.
 */
import {
  formatAngle,
  formatLength,
  type Kicker,
  type Unit,
} from "@/lib/kicker";
import {
  geometryFor,
  project,
  strutBoxes,
  type Canvas,
  type DiagramGeometry,
  type Insets,
  type Projection,
} from "@/lib/drawing/project";

export type LineWeight = "main" | "thin";

export interface Point {
  x: number;
  y: number;
}

/** A stroked open or closed polyline. */
export interface Polyline {
  kind: "polyline";
  points: readonly Point[];
  closed?: boolean;
  weight?: LineWeight;
}

/**
 * A filled polygon, used only for arrow tips. Splitting arrows into a stroked
 * shaft and a filled head is the same choice the editor's `Arrow` component
 * makes, for the same reason: heads that are drawn as thick strokes vary with
 * the line-width setting in ways that the arrow's identity should not.
 */
export interface FilledPolygon {
  kind: "polygon";
  points: readonly Point[];
}

/** A text placement. Sizes and offsets are in output-space units. */
export interface Text {
  kind: "text";
  x: number;
  y: number;
  text: string;
  size: number;
  align?: "left" | "center" | "right";
  baseline?: "top" | "middle" | "bottom";
  /** Anticlockwise, in radians. */
  rotation?: number;
}

export type Primitive = Polyline | FilledPolygon | Text;

/**
 * How much space the annotations need around the drawing. Every consumer of
 * this module needs the same allowance, so it is fixed here rather than
 * asked of the caller.
 */
export const SIDE_VIEW_INSETS: Insets = { top: 40, right: 90, bottom: 60, left: 60 };

/** Fraction of the tick length that closes the arrow head. */
const TIP_LENGTH = 8;
const TIP_HALF_WIDTH = 3.5;

/** How far a dimension sits off the thing it measures, in output-space units. */
const DIM_OFFSET = 22;

const TEXT_SIZE = 9;
const ANGLE_LEG = 40;

/** One arrow tip as a filled triangle pointing along a unit vector. */
function tip(x: number, y: number, dx: number, dy: number): FilledPolygon {
  // Perpendicular, for the two back corners of the tip.
  const px = -dy;
  const py = dx;
  const backX = x - dx * TIP_LENGTH;
  const backY = y - dy * TIP_LENGTH;

  return {
    kind: "polygon",
    points: [
      { x, y },
      { x: backX + px * TIP_HALF_WIDTH, y: backY + py * TIP_HALF_WIDTH },
      { x: backX - px * TIP_HALF_WIDTH, y: backY - py * TIP_HALF_WIDTH },
    ],
  };
}

/**
 * A measurement, drawn between two points that are already in output space,
 * with a label astride the line and two witness extensions back to the thing
 * being measured.
 */
function dimension({
  from,
  to,
  label,
  extendFrom,
  labelSide = "outside",
}: {
  from: Point;
  to: Point;
  label: string;
  extendFrom?: [Point, Point];
  labelSide?: "outside" | "inside";
}): Primitive[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  const ux = dx / length;
  const uy = dy / length;

  // Labels sit off the line on its perpendicular, on whichever side is away
  // from the drawing.
  const sign = labelSide === "outside" ? 1 : -1;
  const px = -uy * sign;
  const py = ux * sign;
  const midX = (from.x + to.x) / 2 + px * 10;
  const midY = (from.y + to.y) / 2 + py * 10;
  const vertical = Math.abs(uy) > Math.abs(ux);

  const primitives: Primitive[] = [];

  if (extendFrom) {
    primitives.push(
      { kind: "polyline", points: [extendFrom[0], from], weight: "thin" },
      { kind: "polyline", points: [extendFrom[1], to], weight: "thin" },
    );
  }

  primitives.push({ kind: "polyline", points: [from, to] });
  primitives.push(tip(from.x, from.y, -ux, -uy));
  primitives.push(tip(to.x, to.y, ux, uy));
  primitives.push({
    kind: "text",
    x: midX,
    y: midY,
    text: label,
    size: TEXT_SIZE,
    align: "center",
    baseline: "middle",
    rotation: vertical ? -Math.PI / 2 : 0,
  });

  return primitives;
}

/** The 1m grid the editor draws in 3D, ported to page two for scale reference. */
function grid(projection: Projection, canvas: Canvas): Primitive[] {
  const step = projection.scale;
  const primitives: Primitive[] = [];

  // Vertical lines every metre, marching either side of x=0.
  for (let x = projection.x(0); x <= canvas.width; x += step) {
    primitives.push({
      kind: "polyline",
      points: [
        { x, y: 0 },
        { x, y: canvas.height },
      ],
      weight: "thin",
    });
  }
  for (let x = projection.x(0) - step; x >= 0; x -= step) {
    primitives.push({
      kind: "polyline",
      points: [
        { x, y: 0 },
        { x, y: canvas.height },
      ],
      weight: "thin",
    });
  }

  // Horizontal lines every metre, from the ground up.
  for (let y = projection.groundY; y >= 0; y -= step) {
    primitives.push({
      kind: "polyline",
      points: [
        { x: 0, y },
        { x: canvas.width, y },
      ],
      weight: "thin",
    });
  }
  for (let y = projection.groundY + step; y <= canvas.height; y += step) {
    primitives.push({
      kind: "polyline",
      points: [
        { x: 0, y },
        { x: canvas.width, y },
      ],
      weight: "thin",
    });
  }

  return primitives;
}

/** The ramp itself: the plywood profile, the deck outline, the struts. */
function ramp(projection: Projection, geometry: DiagramGeometry): Primitive[] {
  const primitives: Primitive[] = [];

  primitives.push({
    kind: "polyline",
    points: geometry.profile.map((p) => ({ x: projection.x(p[0]), y: projection.y(p[1]) })),
    closed: true,
  });

  primitives.push({
    kind: "polyline",
    points: geometry.surface.map((p) => ({ x: projection.x(p[0]), y: projection.y(p[1]) })),
    closed: true,
  });

  for (const box of strutBoxes(geometry.struts, geometry.radius)) {
    const size = box.size * projection.scale;
    const cx = projection.x(box.centre[0]);
    const cy = projection.y(box.centre[1]);
    const cos = Math.cos(-box.angleRad);
    const sin = Math.sin(-box.angleRad);
    const half = size / 2;

    const corners: Point[] = [
      { x: -half, y: -half },
      { x: half, y: -half },
      { x: half, y: half },
      { x: -half, y: half },
    ].map((c) => ({ x: cx + c.x * cos - c.y * sin, y: cy + c.x * sin + c.y * cos }));

    primitives.push({ kind: "polyline", points: corners, closed: true });
  }

  return primitives;
}

/** The exit-angle mark: an arc between the ground direction and the lip tangent. */
function angleMark(
  projection: Projection,
  geometry: DiagramGeometry,
  angleLabel: string,
): Primitive[] {
  const { angle, radius, height } = geometry;
  const angleRad = (angle * Math.PI) / 180;
  const lipX = radius * Math.sin(angleRad);

  const originX = projection.x(lipX);
  const originY = projection.y(height);
  const leg = Math.min(ANGLE_LEG, projection.scale * 0.6);

  const horizontal: Point = { x: originX + leg, y: originY };
  const tangent: Point = {
    x: originX + leg * Math.cos(angleRad),
    y: originY - leg * Math.sin(angleRad),
  };

  // Sample the small arc between the horizontal and the tangent, in output
  // space. Twelve segments is more than enough at print size.
  const arcRadius = leg * 0.62;
  const steps = 12;
  const arcPoints: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * angleRad;
    arcPoints.push({
      x: originX + arcRadius * Math.cos(t),
      y: originY - arcRadius * Math.sin(t),
    });
  }

  return [
    { kind: "polyline", points: [{ x: originX, y: originY }, horizontal], weight: "thin" },
    { kind: "polyline", points: [{ x: originX, y: originY }, tangent], weight: "thin" },
    { kind: "polyline", points: arcPoints },
    {
      kind: "text",
      x: originX + leg + 4,
      y: originY - (leg * Math.sin(angleRad)) / 2,
      text: angleLabel,
      size: TEXT_SIZE,
      align: "left",
      baseline: "middle",
    },
  ];
}

/**
 * Every primitive the side view is made of, for the given kicker and canvas.
 *
 * `canvas` is the drawable area inside the blueprint frame — the PDF writer
 * has already inset the page and drawn the notched border, so this fills the
 * remaining rectangle. Origin is at the top-left, y grows downwards, in the
 * caller's chosen unit.
 */
export function buildSideView(
  kicker: Kicker,
  canvas: Canvas,
  unit: Unit,
  insets: Insets = SIDE_VIEW_INSETS,
): Primitive[] {
  const geometry = geometryFor(kicker.height, kicker.angle);
  const { length, radius, arc } = geometry.results;
  const { angle, height } = geometry;

  /*
   * The projection is fit to the ramp's footprint rather than to the profile
   * outline. The outline starts a few centimetres in from the toe (where the
   * arc first becomes as thick as the plywood), so a projection built from
   * `boundsOf(profile)` maps model x=0 into negative output space — and the
   * base dimension line, which really does start at the toe, falls off the
   * left of the page. Using the footprint reserves room for it.
   */
  const bounds = { minX: 0, minY: 0, width: length, height };
  const projection = project(bounds, canvas, insets);
  const angleRad = (angle * Math.PI) / 180;

  const groundY = projection.groundY;
  const lipModelX = radius * Math.sin(angleRad);
  const lipX = projection.x(lipModelX);
  const lipY = projection.y(height);

  const primitives: Primitive[] = [];

  primitives.push(...grid(projection, canvas));

  // The ground the ramp stands on. Drawn as a slightly heavier line than the
  // grid so it reads as the reference rather than as one of the graticules.
  primitives.push({
    kind: "polyline",
    points: [
      { x: 0, y: groundY },
      { x: canvas.width, y: groundY },
    ],
  });

  primitives.push(...ramp(projection, geometry));

  // Base length, running along the ground under the ramp with a line
  // extending down from the lip and the toe.
  const baselineY = groundY + DIM_OFFSET;
  primitives.push(
    ...dimension({
      from: { x: projection.x(0), y: baselineY },
      to: { x: projection.x(length), y: baselineY },
      label: formatLength(length, unit),
      extendFrom: [
        { x: projection.x(0), y: groundY },
        { x: projection.x(length), y: groundY },
      ],
    }),
  );

  // Height, running up the right of the ramp beside the lip.
  const heightLineX = projection.x(length) + DIM_OFFSET;
  primitives.push(
    ...dimension({
      from: { x: heightLineX, y: groundY },
      to: { x: heightLineX, y: projection.y(height) },
      label: formatLength(height, unit),
      extendFrom: [
        { x: projection.x(length), y: groundY },
        { x: projection.x(length), y: projection.y(height) },
      ],
    }),
  );

  // Radius, as a stub from the lip towards the arc's centre. A real dimension
  // to the centre is off-drawing for every kicker the app builds, which is why
  // the editor draws a stub too (Annotations.tsx).
  const radiusStub = Math.min(80, projection.scale * 0.9);
  const stubEnd: Point = {
    x: lipX - radiusStub * Math.sin(angleRad),
    y: lipY - radiusStub * Math.cos(angleRad),
  };
  primitives.push({
    kind: "polyline",
    points: [stubEnd, { x: lipX, y: lipY }],
  });
  primitives.push(tip(lipX, lipY, Math.sin(angleRad), Math.cos(angleRad)));
  primitives.push({
    kind: "text",
    x: stubEnd.x - 6,
    y: stubEnd.y - 4,
    text: formatLength(radius, unit),
    size: TEXT_SIZE,
    align: "right",
    baseline: "bottom",
  });

  // Surface length, written above the arc it measures. Sampled at the midpoint
  // of the sweep, pushed outward along the arc's own normal.
  const halfRad = angleRad / 2;
  const arcOffset = 14;
  primitives.push({
    kind: "text",
    x:
      projection.x(radius * Math.sin(halfRad)) -
      arcOffset * Math.sin(halfRad),
    y:
      projection.y(radius * (1 - Math.cos(halfRad))) -
      arcOffset * Math.cos(halfRad),
    text: formatLength(arc, unit),
    size: TEXT_SIZE,
    align: "center",
    baseline: "bottom",
    rotation: halfRad,
  });

  // Exit angle, at the lip.
  primitives.push(...angleMark(projection, geometry, formatAngle(angle)));

  return primitives;
}
