/**
 * The landing page illustrations.
 *
 * Every line in these is computed from `@/lib/kicker` by `@/lib/drawing/project`, so they
 * are drawings of what the app actually produces rather than pictures of what
 * it produced once. They are also plain server-rendered markup: no hooks, no
 * three.js, nothing shipped to the browser.
 *
 * The drafting vocabulary follows the editor's own annotations
 * (src/scene/annotations): extension lines, dimension lines with arrow tips,
 * an arc at the lip for the exit angle.
 */
import { defaultKicker, formatAngle, formatLength, type Unit } from "@/lib/kicker";
import {
  boundsOf,
  geometryFor,
  project,
  ridingLine,
  strutBoxes,
  type Canvas,
  type DiagramGeometry,
  type Insets,
  type Projection,
} from "@/lib/drawing/project";
import styles from "./landing.module.css";

/**
 * How far the arrow tip extends, in SVG units. Fixed rather than scaled with
 * the drawing, so tips stay the same weight as the type next to them.
 */
const TIP = 5;

/**
 * A 1m blueprint grid, matching the editor's ground grid.
 *
 * `id` has to be unique across the document, which is why every caller
 * suffixes it with the unit: BothUnits puts two copies of each drawing on the
 * page, and two patterns under one id would leave the second referencing the
 * first.
 */
function Grid({ id, projection, canvas }: { id: string; projection: Projection; canvas: Canvas }) {
  const step = projection.scale;

  return (
    <>
      <defs>
        <pattern
          id={id}
          width={step}
          height={step}
          patternUnits="userSpaceOnUse"
          // Pinned to the ground line and the origin so the grid reads as the
          // metre grid the ramp stands on, not as graph paper behind it.
          patternTransform={`translate(${projection.x(0)} ${projection.groundY})`}
        >
          <path d={`M ${step} 0 L 0 0 0 ${step}`} className={styles.gridLine} />
        </pattern>
      </defs>
      <rect width={canvas.width} height={canvas.height} fill={`url(#${id})`} />
    </>
  );
}

/** One arrow tip, as a filled triangle pointing along `direction`. */
function Tip({ x, y, direction }: { x: number; y: number; direction: [number, number] }) {
  const [dx, dy] = direction;
  // Perpendicular, for the two back corners.
  const [px, py] = [-dy, dx];
  const half = TIP / 2.5;
  const back = [x - dx * TIP, y - dy * TIP];

  return (
    <polygon
      className={styles.annotationFill}
      points={[
        `${x},${y}`,
        `${back[0] + px * half},${back[1] + py * half}`,
        `${back[0] - px * half},${back[1] - py * half}`,
      ].join(" ")}
    />
  );
}

/**
 * A measurement, drawn between two points that are already in SVG space.
 *
 * `extendFrom` draws the thin witness lines back to the thing being measured,
 * which is what stops a dimension floating unattached beside the drawing.
 */
function Dimension({
  from,
  to,
  label,
  labelSide = "outside",
  extendFrom,
}: {
  from: [number, number];
  to: [number, number];
  label: string;
  labelSide?: "outside" | "inside";
  extendFrom?: [[number, number], [number, number]];
}) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const length = Math.hypot(x2 - x1, y2 - y1);
  const direction: [number, number] = [(x2 - x1) / length, (y2 - y1) / length];
  const away: [number, number] = [-direction[0], -direction[1]];

  // Labels sit off the line on its perpendicular, on whichever side is away
  // from the drawing.
  const sign = labelSide === "outside" ? 1 : -1;
  const offset = 6;
  const labelX = (x1 + x2) / 2 + -direction[1] * offset * sign;
  const labelY = (y1 + y2) / 2 + direction[0] * offset * sign;
  // Vertical dimensions read better with the text turned to follow the line.
  const vertical = Math.abs(direction[1]) > Math.abs(direction[0]);

  return (
    <g>
      {extendFrom?.map(([ex, ey], index) => (
        <line
          key={index}
          x1={ex}
          y1={ey}
          x2={index === 0 ? x1 : x2}
          y2={index === 0 ? y1 : y2}
          className={styles.witnessLine}
        />
      ))}
      <line x1={x1} y1={y1} x2={x2} y2={y2} className={styles.annotationLine} />
      <Tip x={x1} y={y1} direction={away} />
      <Tip x={x2} y={y2} direction={direction} />
      <text
        x={labelX}
        y={labelY}
        className={styles.dimensionLabel}
        textAnchor="middle"
        dominantBaseline="central"
        transform={vertical ? `rotate(-90 ${labelX} ${labelY})` : undefined}
      >
        {label}
      </text>
    </g>
  );
}

/** The exit angle, as an arc between the ground direction and the lip tangent. */
function AngleMark({
  projection,
  geometry,
}: {
  projection: Projection;
  geometry: DiagramGeometry;
}) {
  const { angle, radius, height } = geometry;
  const angleRad = (angle * Math.PI) / 180;
  const lipX = radius * Math.sin(angleRad);

  const originX = projection.x(lipX);
  const originY = projection.y(height);
  // Long enough to read at every angle in the slider's range.
  const leg = Math.min(54, projection.scale * 0.6);

  const horizontal = [originX + leg, originY];
  const tangent = [originX + leg * Math.cos(angleRad), originY - leg * Math.sin(angleRad)];
  const arcRadius = leg * 0.62;

  return (
    <g>
      <line
        x1={originX}
        y1={originY}
        x2={horizontal[0]}
        y2={horizontal[1]}
        className={styles.witnessLine}
      />
      <line
        x1={originX}
        y1={originY}
        x2={tangent[0]}
        y2={tangent[1]}
        className={styles.witnessLine}
      />
      <path
        d={[
          `M ${originX + arcRadius} ${originY}`,
          // Sweep 0 because SVG's y is flipped, so anticlockwise in the model
          // is clockwise here.
          `A ${arcRadius} ${arcRadius} 0 0 0`,
          `${originX + arcRadius * Math.cos(angleRad)} ${originY - arcRadius * Math.sin(angleRad)}`,
        ].join(" ")}
        className={styles.annotationLine}
        fill="none"
      />
      <text
        x={originX + leg + 6}
        y={originY - leg * Math.sin(angleRad) * 0.5}
        className={styles.dimensionLabel}
        dominantBaseline="central"
      >
        {formatAngle(angle)}
      </text>
    </g>
  );
}

/** The ramp itself: the plywood cheek, with the riding surface on top of it. */
function Profile({
  projection,
  geometry,
  outlineOnly = false,
}: {
  projection: Projection;
  geometry: DiagramGeometry;
  outlineOnly?: boolean;
}) {
  return (
    <g>
      <polygon
        points={projection.points(geometry.profile)}
        className={outlineOnly ? styles.profileOutline : styles.profile}
      />
      <polygon points={projection.points(geometry.surface)} className={styles.surface} />
    </g>
  );
}

const HERO_CANVAS: Canvas = { width: 520, height: 330 };
const HERO_INSETS: Insets = { top: 34, right: 88, bottom: 52, left: 18 };

/**
 * The annotated side view, and the one drawing that has to explain the whole
 * app on its own: this is what you get out of it.
 */
export function HeroDiagram({
  height,
  angle,
  units,
}: {
  height: number;
  angle: number;
  units: Unit;
}) {
  const geometry = geometryFor(height, angle);
  const projection = project(boundsOf(geometry.profile), HERO_CANVAS, HERO_INSETS);
  const { length } = geometry.results;

  const groundY = projection.groundY;
  const baseline = groundY + 30;
  const heightLine = projection.x(length) + 42;

  return (
    <svg
      viewBox={`0 0 ${HERO_CANVAS.width} ${HERO_CANVAS.height}`}
      className={styles.heroDiagram}
      role="img"
      aria-label={`Side view of a ${formatLength(height, units)} kicker with a ${formatAngle(
        angle,
      )} exit angle, ${formatLength(length, units)} from front to back.`}
    >
      <Grid id={`hero-grid-${units}`} projection={projection} canvas={HERO_CANVAS} />
      <line
        x1={0}
        y1={groundY}
        x2={HERO_CANVAS.width}
        y2={groundY}
        className={styles.groundLine}
      />

      <Profile projection={projection} geometry={geometry} />
      <AngleMark projection={projection} geometry={geometry} />

      <Dimension
        from={[projection.x(0), baseline]}
        to={[projection.x(length), baseline]}
        label={formatLength(length, units)}
        extendFrom={[
          [projection.x(0), groundY],
          [projection.x(length), groundY],
        ]}
      />

      <Dimension
        from={[heightLine, groundY]}
        to={[heightLine, projection.y(height)]}
        label={formatLength(height, units)}
        extendFrom={[
          [projection.x(length), groundY],
          [projection.x(length), projection.y(height)],
        ]}
      />
    </svg>
  );
}

const STEP_CANVAS: Canvas = { width: 300, height: 200 };

/**
 * Three sizes from across the sliders' range, as the lines you would ride.
 *
 * Drawn as bare curves fanning from a common toe rather than as three closed
 * outlines: overlaid ramps cross each other's edges and the picture stops
 * being about the spread, which is the only thing this one is for. The middle
 * size is the default, and the outer two are inside `parameterRanges`, so it
 * cannot advertise a ramp the app will not build.
 */
export function RangeDiagram({ units }: { units: Unit }) {
  const sizes = [
    { height: 0.6, angle: 32 },
    { height: defaultKicker.height, angle: defaultKicker.angle },
    { height: 2.2, angle: 62 },
  ];
  const drawings = sizes.map(({ height, angle }) => geometryFor(height, angle));
  const biggest = drawings[drawings.length - 1];
  const insets: Insets = { top: 22, right: 58, bottom: 26, left: 12 };
  const projection = project(boundsOf(ridingLine(biggest)), STEP_CANVAS, insets);

  /*
   * Labels go in a column down the right rather than beside the lip they
   * belong to, with a leader line back to it. The lips sit diagonally from one
   * another, so a label at each one lands on top of the next curve along.
   */
  const labelX = STEP_CANVAS.width - insets.right + 10;

  return (
    <svg
      viewBox={`0 0 ${STEP_CANVAS.width} ${STEP_CANVAS.height}`}
      className={styles.stepDiagram}
      role="img"
      aria-label={`Three kickers drawn to the same scale, from ${formatLength(
        sizes[0].height,
        units,
      )} tall to ${formatLength(sizes[2].height, units)} tall.`}
    >
      <Grid id={`range-grid-${units}`} projection={projection} canvas={STEP_CANVAS} />
      <line
        x1={0}
        y1={projection.groundY}
        x2={STEP_CANVAS.width}
        y2={projection.groundY}
        className={styles.groundLine}
      />

      {drawings.map((geometry, index) => {
        const line = ridingLine(geometry);
        const lip = line[line.length - 1];
        const middle = index === 1;
        const lipY = projection.y(lip[1]);

        return (
          <g key={index}>
            <polyline
              points={projection.points(line)}
              className={middle ? styles.rideLine : styles.rideLineGhost}
            />
            <line
              x1={projection.x(lip[0])}
              y1={lipY}
              x2={labelX - 4}
              y2={lipY}
              className={styles.witnessLine}
            />
            <text
              x={labelX}
              y={lipY}
              className={middle ? styles.dimensionLabel : styles.ghostLabel}
              dominantBaseline="central"
            >
              {formatLength(geometry.height, units)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * The derived figures: the transition radius, and how much surface has to be
 * cut to cover it.
 *
 * The radius is drawn as a stub rather than to its centre, the same compromise
 * the editor makes — a 1.2m kicker at 45 degrees turns on a 4.1m radius, whose
 * centre is well outside any box the ramp is legible in.
 */
export function MeasurementsDiagram({ units }: { units: Unit }) {
  const geometry = geometryFor(defaultKicker.height, defaultKicker.angle);
  const projection = project(boundsOf(geometry.profile), STEP_CANVAS, {
    top: 46,
    right: 30,
    bottom: 22,
    left: 30,
  });

  const { radius, angle, height } = geometry;
  const { arc } = geometry.results;
  const angleRad = (angle * Math.PI) / 180;
  const halfRad = angleRad / 2;

  // From the lip towards the arc's centre, which is straight up from the
  // ramp's toe at (0, radius).
  const lip: [number, number] = [projection.x(radius * Math.sin(angleRad)), projection.y(height)];
  const stub = 42;
  const towardsCentre: [number, number] = [
    lip[0] - stub * Math.sin(angleRad),
    lip[1] - stub * Math.cos(angleRad),
  ];

  /*
   * The arc's own midpoint, pushed out along its normal, so the surface length
   * is written in the empty air above the curve it measures rather than across
   * the ramp.
   */
  const label = {
    x: projection.x(radius * Math.sin(halfRad) - 0.3 * Math.sin(halfRad)),
    y: projection.y(radius * (1 - Math.cos(halfRad)) + 0.3 * Math.cos(halfRad)),
  };

  return (
    <svg
      viewBox={`0 0 ${STEP_CANVAS.width} ${STEP_CANVAS.height}`}
      className={styles.stepDiagram}
      role="img"
      aria-label={`The same kicker with its transition radius of ${formatLength(
        radius,
        units,
      )} and its surface length of ${formatLength(arc, units)} called out.`}
    >
      <Grid id={`measure-grid-${units}`} projection={projection} canvas={STEP_CANVAS} />
      <line
        x1={0}
        y1={projection.groundY}
        x2={STEP_CANVAS.width}
        y2={projection.groundY}
        className={styles.groundLine}
      />

      <Profile projection={projection} geometry={geometry} />

      {/* The surface traced again in the accent colour, with its length on it. */}
      <polyline points={projection.points(ridingLine(geometry))} className={styles.surfaceTrace} />

      {/*
       * The radius, as a leader pointing back at the lip with its figure at
       * the loose end. A dimension line with the label astride it would print
       * the number across the stub at this size.
       */}
      <line
        x1={towardsCentre[0]}
        y1={towardsCentre[1]}
        x2={lip[0]}
        y2={lip[1]}
        className={styles.annotationLine}
      />
      <Tip x={lip[0]} y={lip[1]} direction={[Math.sin(angleRad), Math.cos(angleRad)]} />
      <text
        x={towardsCentre[0] + 4}
        y={towardsCentre[1] - 8}
        className={styles.dimensionLabel}
        textAnchor="middle"
      >
        {formatLength(radius, units)}
      </text>

      <text x={label.x} y={label.y} className={styles.traceLabel} textAnchor="middle">
        {formatLength(arc, units)}
      </text>
    </svg>
  );
}

/**
 * The frame under the deck.
 *
 * Struts are spaced and sized by `calculateStrutPlacements`, so the count in
 * the caption is the count the app would build.
 */
export function StrutsDiagram({ units }: { units: Unit }) {
  const geometry = geometryFor(defaultKicker.height, defaultKicker.angle);
  const projection = project(boundsOf(geometry.profile), STEP_CANVAS, {
    top: 22,
    right: 16,
    bottom: 22,
    left: 12,
  });
  const boxes = strutBoxes(geometry.struts, geometry.radius);

  return (
    <svg
      viewBox={`0 0 ${STEP_CANVAS.width} ${STEP_CANVAS.height}`}
      className={styles.stepDiagram}
      role="img"
      aria-label={`The same kicker cut away to show its ${boxes.length} struts, with a base ${formatLength(
        geometry.results.length,
        units,
      )} long.`}
    >
      <Grid id={`struts-grid-${units}`} projection={projection} canvas={STEP_CANVAS} />
      <line
        x1={0}
        y1={projection.groundY}
        x2={STEP_CANVAS.width}
        y2={projection.groundY}
        className={styles.groundLine}
      />

      <Profile projection={projection} geometry={geometry} outlineOnly />

      {boxes.map(({ centre, size, angleRad }, index) => {
        const side = size * projection.scale;
        return (
          <rect
            key={index}
            x={-side / 2}
            y={-side / 2}
            width={side}
            height={side}
            className={styles.strut}
            transform={[
              `translate(${projection.x(centre[0]).toFixed(2)} ${projection.y(centre[1]).toFixed(2)})`,
              `rotate(${((-angleRad * 180) / Math.PI).toFixed(2)})`,
            ].join(" ")}
          />
        );
      })}
    </svg>
  );
}

/** How many struts the default kicker needs, for the caption beside it. */
export function defaultStrutCount(): number {
  return geometryFor(defaultKicker.height, defaultKicker.angle).struts.length;
}
