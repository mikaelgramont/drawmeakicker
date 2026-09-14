import {
  Box3,
  BufferAttribute,
  BufferGeometry,
  ExtrudeGeometry,
  Object3D,
  Shape,
} from "three";
import type { Point2 } from "@/lib/kicker";

/** Builds a closed three.js Shape from a list of profile points. */
export function shapeFromPoints(points: readonly Point2[]): Shape {
  const shape = new Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i][0], points[i][1]);
  }
  return shape;
}

/**
 * Extrudes a profile along +Z.
 *
 * The legacy code passed `{ amount, bevelSize: 0, bevelSegments: 1,
 * bevelThickness: 0 }`, which left bevelling enabled but zero-sized: the same
 * shape with extra degenerate geometry. `depth` is the modern name for
 * `amount`, and disabling bevelling outright drops the dead triangles.
 */
export function extrudeProfile(points: readonly Point2[], depth: number): ExtrudeGeometry {
  return new ExtrudeGeometry(shapeFromPoints(points), { depth, bevelEnabled: false });
}

export type Axis = "x" | "y" | "z";
const AXIS_INDEX: Record<Axis, number> = { x: 0, y: 1, z: 2 };

/**
 * Replaces Utils.setupUVMapping, which wrote geometry.faceVertexUvs by hand.
 *
 * Projects the wood grain onto the geometry along one axis pair, ignoring the
 * UVs that ExtrudeGeometry generates. The unusual half-range mapping on u is
 * deliberate: it samples the middle of the texture, which is what kept the
 * grain from stretching across the extruded walls in the original.
 */
export function applyPlanarUv(geometry: BufferGeometry, uAxis: Axis, vAxis: Axis): void {
  const position = geometry.getAttribute("position");
  const u = AXIS_INDEX[uAxis];
  const v = AXIS_INDEX[vAxis];

  let minU = Infinity;
  let maxU = -Infinity;
  let minV = Infinity;
  let maxV = -Infinity;

  for (let i = 0; i < position.count; i++) {
    const uValue = position.getComponent(i, u);
    const vValue = position.getComponent(i, v);
    if (uValue < minU) minU = uValue;
    if (uValue > maxU) maxU = uValue;
    if (vValue < minV) minV = vValue;
    if (vValue > maxV) maxV = vValue;
  }

  const rangeU = maxU - minU;
  const rangeV = maxV - minV;
  const uv = new Float32Array(position.count * 2);

  for (let i = 0; i < position.count; i++) {
    uv[i * 2] = (position.getComponent(i, u) + rangeU / 2) / (2 * rangeU);
    uv[i * 2 + 1] = position.getComponent(i, v) / rangeV;
  }

  geometry.setAttribute("uv", new BufferAttribute(uv, 2));
}

/** Set on objects that should not influence the 2D camera framing. */
export const EXCLUDE_FROM_FIT = { excludeFromFit: true } as const;

/**
 * World-space bounding box of everything currently visible under `object`.
 *
 * Box3.setFromObject walks hidden subtrees too, but the 2D camera has to frame
 * only what is actually drawn: with annotations off, the radius arrow must not
 * keep reserving two metres of headroom. Replaces the custom Box3 subclass in
 * legacy/public/scripts/box.js.
 *
 * Bounding boxes are recomputed rather than reused, because the outlines are
 * instanced line geometry whose positions are rewritten after construction and
 * whose cached box would be a frame stale.
 */
export function visibleBoundingBox(object: Object3D, target = new Box3()): Box3 {
  target.makeEmpty();
  const box = new Box3();

  const walk = (node: Object3D) => {
    if (!node.visible || node.userData.excludeFromFit) return;

    const geometry = (node as Object3D & { geometry?: BufferGeometry }).geometry;
    if (geometry) {
      geometry.computeBoundingBox();
      if (geometry.boundingBox) {
        box.copy(geometry.boundingBox).applyMatrix4(node.matrixWorld);
        target.union(box);
      }
    }

    for (const child of node.children) walk(child);
  };

  object.updateMatrixWorld(true);
  walk(object);
  return target;
}
