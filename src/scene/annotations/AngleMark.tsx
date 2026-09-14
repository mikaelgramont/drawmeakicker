"use client";

import { useMemo } from "react";
import { Line } from "@react-three/drei";
import { OUTLINE_COLOR } from "../constants";

type Vec3 = [number, number, number];

const ARC_STEPS = 12;
/** The arc sits inside the corner it annotates. */
const ARC_RADIUS_RATIO = 0.6;

/**
 * The exit-angle marker: two legs meeting at the lip with a small arc swept
 * between them. Ported from legacy/public/models/parts/angle.js.
 */
export function AngleMark({
  angleDegrees,
  cornerSide,
  lineWidth,
}: {
  angleDegrees: number;
  cornerSide: number;
  lineWidth: number;
}) {
  const angleRad = (angleDegrees * Math.PI) / 180;

  const corner: Vec3[] = [
    [cornerSide, 0, 0],
    [0, 0, 0],
    [cornerSide * Math.cos(angleRad), cornerSide * Math.sin(angleRad), 0],
  ];

  const arc = useMemo(() => {
    const radius = cornerSide * ARC_RADIUS_RATIO;
    return Array.from({ length: ARC_STEPS + 1 }, (_, i): Vec3 => {
      const step = (angleRad * i) / ARC_STEPS;
      return [radius * Math.cos(step), radius * Math.sin(step), 0];
    });
  }, [angleRad, cornerSide]);

  return (
    <>
      <Line points={corner} color={OUTLINE_COLOR} lineWidth={lineWidth} />
      <Line points={arc} color={OUTLINE_COLOR} lineWidth={lineWidth} />
    </>
  );
}
