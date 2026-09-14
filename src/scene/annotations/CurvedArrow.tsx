"use client";

import { useMemo } from "react";
import { Line } from "@react-three/drei";
import { Euler, Vector3 } from "three";
import { kickerConfig } from "@/lib/kicker";
import { OUTLINE_COLOR } from "../constants";

type Vec3 = [number, number, number];

const STEPS = 20;
const TIP = 0.05;
/** Start the sweep a few degrees up so the arrowhead clears the ground. */
const START_ANGLE_DEGREES = 5;

/**
 * Samples an arc that runs parallel to the riding surface, offset inwards by
 * `distance` and pulled back past the lip extension.
 */
function sampleMeasureArc(exitAngleDegrees: number, radius: number, distance: number): Vec3[] {
  const innerRadius = radius - distance;
  const startRad = (START_ANGLE_DEGREES * Math.PI) / 180;
  const endRad = (exitAngleDegrees * Math.PI) / 180;
  const points: Vec3[] = [];

  for (let i = 0; i <= STEPS; i++) {
    const angleRad = (i / STEPS) * (endRad - startRad) + startRad;
    points.push([
      innerRadius * Math.sin(angleRad) - kickerConfig.sides.extraLength,
      innerRadius * (1 - Math.cos(angleRad)) + distance,
      0,
    ]);
  }

  return points;
}

/** The arrowhead at the top, rotated to lie tangent to the arc. */
function endTipPoints(end: Vec3, exitAngleDegrees: number): Vec3[] {
  const rotation = new Euler(
    0,
    0,
    ((exitAngleDegrees + START_ANGLE_DEGREES) * Math.PI) / 180,
    "XYZ",
  );

  return [
    [-TIP, -TIP / 2, 0],
    [0, 0, 0],
    [-TIP, TIP / 2, 0],
  ].map((vertex) => {
    const point = new Vector3(...vertex).applyEuler(rotation);
    return [point.x + end[0], point.y + end[1], 0];
  });
}

/**
 * The curved dimension arrow measuring the length of the riding surface.
 * Returns its own sample points so the label can be placed on the chord.
 */
export function CurvedArrow({
  exitAngleDegrees,
  radius,
  distance,
  lineWidth,
  children,
}: {
  exitAngleDegrees: number;
  radius: number;
  distance: number;
  lineWidth: number;
  children?: (points: Vec3[]) => React.ReactNode;
}) {
  const points = useMemo(
    () => sampleMeasureArc(exitAngleDegrees, radius, distance),
    [exitAngleDegrees, radius, distance],
  );
  const start = points[0];
  const end = points[points.length - 1];

  return (
    <>
      <Line points={points} color={OUTLINE_COLOR} lineWidth={lineWidth} />
      <Line
        points={[
          [TIP + start[0], -TIP / 2 + start[1], 0],
          [start[0], start[1], 0],
          [TIP + start[0], TIP / 2 + start[1], 0],
        ]}
        color={OUTLINE_COLOR}
        lineWidth={lineWidth}
      />
      <Line
        points={endTipPoints(end, exitAngleDegrees)}
        color={OUTLINE_COLOR}
        lineWidth={lineWidth}
      />
      {children?.(points)}
    </>
  );
}
