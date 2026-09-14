"use client";

import { Line, Text } from "@react-three/drei";
import { ANNOTATION_FONT, ANNOTATION_TEXT_SIZE, OUTLINE_COLOR } from "../constants";
import { EXCLUDE_FROM_FIT } from "../geometry";

type Vec3 = [number, number, number];

/**
 * A measurement label.
 *
 * The legacy app built these as flat TextGeometry from a typeface.js font dump
 * and centred them by measuring the resulting bounding box. drei's Text is
 * signed-distance-field text drawn straight from the OTF, so it stays sharp
 * under the 2D camera's zoom and anchors itself.
 *
 * Labels are excluded from the 2D camera fit. Their layout resolves
 * asynchronously, so measuring them would frame the scene off a width that is
 * not known yet; the 10% margin and whole-metre rounding in the fit leave
 * ample room for them.
 */
export function Label({
  children,
  position,
  rotation,
  anchorX = "center",
}: {
  children: string;
  position: Vec3;
  rotation?: Vec3;
  anchorX?: "center" | "left";
}) {
  return (
    <Text
      font={ANNOTATION_FONT}
      fontSize={ANNOTATION_TEXT_SIZE}
      color={OUTLINE_COLOR}
      position={position}
      rotation={rotation}
      anchorX={anchorX}
      anchorY="middle"
      userData={EXCLUDE_FROM_FIT}
    >
      {children}
    </Text>
  );
}

const ARROW_TIP = 0.1;

/**
 * A dimension arrow running from the origin along +X, with optional
 * arrowheads. Drawn as three polylines so the heads stay open, as in the
 * original.
 */
export function Arrow({
  length,
  lineWidth,
  startTip = false,
  endTip = false,
}: {
  length: number;
  lineWidth: number;
  startTip?: boolean;
  endTip?: boolean;
}) {
  return (
    <>
      <Line
        points={[
          [0, 0, 0],
          [length, 0, 0],
        ]}
        color={OUTLINE_COLOR}
        lineWidth={lineWidth}
      />
      {startTip && (
        <Line
          points={[
            [ARROW_TIP, -ARROW_TIP / 2, 0],
            [0, 0, 0],
            [ARROW_TIP, ARROW_TIP / 2, 0],
          ]}
          color={OUTLINE_COLOR}
          lineWidth={lineWidth}
        />
      )}
      {endTip && (
        <Line
          points={[
            [length - ARROW_TIP, -ARROW_TIP / 2, 0],
            [length, 0, 0],
            [length - ARROW_TIP, ARROW_TIP / 2, 0],
          ]}
          color={OUTLINE_COLOR}
          lineWidth={lineWidth}
        />
      )}
    </>
  );
}
