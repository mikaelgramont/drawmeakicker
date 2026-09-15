"use client";

import { useMemo, type Ref } from "react";
import type { Object3D } from "three";
import {
  calculateResults,
  calculateSidePoints,
  calculateStrutPlacements,
  calculateSurfacePoints,
  type Kicker as KickerData,
  type Unit,
} from "@/lib/kicker";
import { Annotations } from "./annotations/Annotations";
import { Board } from "./parts/Board";
import { BlueprintGrid } from "./parts/BlueprintGrid";
import { Sides } from "./parts/Sides";
import { Struts } from "./parts/Struts";
import { Surface } from "./parts/Surface";
import { selectVisibility } from "./visibility";

/**
 * The assembled ramp. Replaces Representation3D, which built every part
 * imperatively and then walked the result flipping visibility flags.
 */
export function Kicker({
  kicker,
  units,
  contentRef,
}: {
  kicker: KickerData;
  units: Unit;
  /** Measured by the 2D camera to frame the drawing. */
  contentRef: Ref<Object3D>;
}) {
  const { height, width, angle } = kicker;

  const results = useMemo(() => calculateResults(height, angle), [height, angle]);
  const { radius, length, arc } = results;

  const sidePoints = useMemo(() => calculateSidePoints(angle, radius), [angle, radius]);
  const surfacePoints = useMemo(() => calculateSurfacePoints(angle, radius), [angle, radius]);
  const strutPlacements = useMemo(
    () => calculateStrutPlacements(angle, radius, arc, length),
    [angle, radius, arc, length],
  );

  const visibility = selectVisibility(kicker);

  return (
    <>
      {/* Outside the measured group: 200 metres of grid would swamp the fit. */}
      <BlueprintGrid visible={visibility.grid} />

      <group ref={contentRef}>
        <Sides points={sidePoints} width={width} visibility={visibility} />
        <Surface points={surfacePoints} width={width} visibility={visibility} />
        <Struts
          placements={strutPlacements}
          radius={radius}
          width={width}
          visibility={visibility}
        />
        <Annotations
          height={height}
          width={width}
          angle={angle}
          results={results}
          units={units}
          visibility={visibility}
        />
      </group>

      <Board width={width} visible={visibility.board} />
    </>
  );
}
