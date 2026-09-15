"use client";

import { useLayoutEffect } from "react";
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Box3, OrthographicCamera as OrthographicCameraImpl, type Object3D } from "three";
import { ANNOTATION_DISTANCE, ANNOTATION_TEXT_SIZE } from "./constants";
import { visibleBoundingBox } from "./geometry";

/** Fraction of slack left around the framed content in the 2D view. */
const FIT_MARGIN = 0.1;

/**
 * Room to reserve for annotation labels, which the bounding box cannot
 * measure. A label hangs one annotation-distance off the line it belongs to,
 * so allow for that plus the height of the text itself.
 */
const LABEL_ALLOWANCE = ANNOTATION_DISTANCE + ANNOTATION_TEXT_SIZE;

const box = new Box3();

/**
 * Frames the 2D view on whatever is currently visible.
 *
 * Ported from EditorScene.createOrthoCamera_. The whole-metre rounding of the
 * content size is deliberate: it keeps the zoom level stable while a slider is
 * being dragged, so the drawing does not breathe on every tick.
 *
 * This runs on every commit rather than against a dependency list, because the
 * framing depends on which parts are visible, not just on the dimensions.
 */
function Fit2dView({
  content,
  pad,
}: {
  content: Object3D | null;
  /** Allowance for content the bounding box cannot measure, in metres. */
  pad: number;
}) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const invalidate = useThree((state) => state.invalidate);

  useLayoutEffect(() => {
    if (!(camera instanceof OrthographicCameraImpl) || !content) return;

    visibleBoundingBox(content, box);
    if (box.isEmpty()) return;
    box.expandByScalar(pad);

    const aspectRatio = size.width / size.height;
    const xRange = (1 + FIT_MARGIN) * Math.ceil(box.max.x - box.min.x);
    const yRange = (1 + FIT_MARGIN) * Math.ceil(box.max.y - box.min.y);
    const xCenter = (box.max.x + box.min.x) / 2;
    const yCenter = (box.max.y + box.min.y) / 2;

    const height = xRange > yRange ? xRange / aspectRatio : yRange;
    const width = height * aspectRatio;

    camera.left = xCenter - width / 2;
    camera.right = xCenter + width / 2;
    camera.top = yCenter + height / 2;
    camera.bottom = yCenter - height / 2;
    camera.updateProjectionMatrix();
    invalidate();
  });

  return null;
}

/**
 * The two cameras: a fitted orthographic one for the flat blueprint, and an
 * orbiting perspective one for the 3D view.
 */
export function Cameras({
  is3d,
  orbitEnabled,
  target,
  content,
  labelled,
}: {
  is3d: boolean;
  /** Orbiting is suspended while a headset is driving the camera. */
  orbitEnabled: boolean;
  /** What the perspective camera orbits around: the middle of the ramp. */
  target: [number, number, number];
  content: Object3D | null;
  /** Whether annotation labels are showing, so the 2D fit can allow for them. */
  labelled: boolean;
}) {
  return (
    <>
      {/*
        Negative near plane so the frustum reaches behind the camera, which is
        what lets a camera sitting at the origin see both side panels.
      */}
      <OrthographicCamera
        makeDefault={!is3d}
        position={[0, 0, 5]}
        near={-10}
        far={10}
      />
      <PerspectiveCamera
        makeDefault={is3d}
        fov={50}
        near={1}
        far={1000}
        position={[-0.95, 1.64, 3.85]}
      />

      {!is3d && (
        <Fit2dView content={content} pad={labelled ? LABEL_ALLOWANCE : 0} />
      )}

      {is3d && (
        <OrbitControls
          makeDefault
          enabled={orbitEnabled}
          target={target}
          zoomSpeed={0.3}
          minDistance={2.5}
          maxDistance={12}
        />
      )}
    </>
  );
}
