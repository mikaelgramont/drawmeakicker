"use client";

import {
  formatAngle,
  formatLength,
  kickerConfig,
  type KickerResults,
  type Unit,
} from "@/lib/kicker";
import { ANNOTATION_DISTANCE } from "../constants";
import type { SceneVisibility } from "../visibility";
import { AngleMark } from "./AngleMark";
import { CurvedArrow } from "./CurvedArrow";
import { Arrow, Label } from "./primitives";

type Vec3 = [number, number, number];

/** Annotation lines were always 2px wide, regardless of the camera. */
const LINE_WIDTH = 2;

/**
 * How long the radius arrow is drawn. The real radius is often far larger
 * than the ramp itself (a 1.2m/45-degree kicker has a 4.1m radius), so the
 * arrow is a fixed stub with the true figure written next to it.
 */
const RADIUS_ARROW_LENGTH = 2;

const CORNER_SIDE = 0.25;

/** A dimension arrow with its label, placed and oriented as a unit. */
function Dimension({
  origin,
  rotation,
  length,
  label,
  labelAbove = false,
  startTip = true,
  endTip = true,
  visible,
}: {
  origin: Vec3;
  rotation: Vec3;
  length: number;
  label: string;
  labelAbove?: boolean;
  startTip?: boolean;
  endTip?: boolean;
  visible: boolean;
}) {
  return (
    <group position={origin} rotation={rotation} visible={visible}>
      <Arrow length={length} lineWidth={LINE_WIDTH} startTip={startTip} endTip={endTip} />
      <Label
        position={[length / 2, labelAbove ? ANNOTATION_DISTANCE : -ANNOTATION_DISTANCE, 0]}
      >
        {label}
      </Label>
    </group>
  );
}

/**
 * The six measurements drawn around the ramp, ported from
 * Representation3D.buildAnnotations.
 */
export function Annotations({
  height,
  width,
  angle,
  results,
  units,
  visibility,
}: {
  height: number;
  width: number;
  angle: number;
  results: KickerResults;
  units: Unit;
  visibility: SceneVisibility;
}) {
  const { length, radius, arc } = results;
  const angleRad = (angle * Math.PI) / 180;
  const distance = ANNOTATION_DISTANCE;

  // The corner of the lip, where the angle and width markers hang.
  const lipX = length + distance * Math.cos(angleRad) - kickerConfig.sides.extraLength;
  const lipY = height + distance * Math.sin(angleRad);

  return (
    <>
      <Dimension
        origin={[0, -distance, width / 2]}
        rotation={[0, 0, 0]}
        length={length}
        label={formatLength(length, units)}
        visible={visibility.annotations}
      />

      <Dimension
        origin={[lipX - 0.02, lipY, -width / 2]}
        rotation={[0, -Math.PI / 2, 0]}
        length={width}
        label={formatLength(width, units)}
        labelAbove
        visible={visibility.widthAnnotation}
      />

      <Dimension
        origin={[length + distance, 0, width / 2]}
        rotation={[0, 0, Math.PI / 2]}
        length={height}
        label={formatLength(height, units)}
        visible={visibility.annotations}
      />

      <Dimension
        origin={[0, distance, -width / 2]}
        rotation={[0, 0, Math.PI / 2]}
        length={RADIUS_ARROW_LENGTH - distance}
        label={formatLength(radius, units)}
        endTip={false}
        visible={visibility.annotations}
      />

      <group position={[0, 0, -width / 2]} visible={visibility.annotations}>
        <CurvedArrow
          exitAngleDegrees={angle}
          radius={radius}
          distance={distance}
          lineWidth={LINE_WIDTH}
        >
          {(points) => {
            const start = points[0];
            const end = points[points.length - 1];
            return (
              <Label
                position={[
                  (start[0] + end[0]) / 2,
                  (start[1] + end[1]) / 2 - 0.15,
                  0,
                ]}
                rotation={[0, 0, angleRad / 2]}
              >
                {formatLength(arc, units)}
              </Label>
            );
          }}
        </CurvedArrow>
      </group>

      <group position={[lipX, lipY, width / 2]} visible={visibility.annotations}>
        <AngleMark angleDegrees={angle} cornerSide={CORNER_SIDE} lineWidth={LINE_WIDTH} />
        <Label position={[CORNER_SIDE, 0.1, 0]} anchorX="left">
          {formatAngle(angle)}
        </Label>
      </group>
    </>
  );
}
