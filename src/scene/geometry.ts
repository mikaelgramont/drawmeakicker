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

/**
 * Projects the wood grain onto a geometry in world units: one tile of texture
 * covers WOOD_TILE metres of timber, whatever the ramp measures.
 *
 * Replaces Utils.setupUVMapping, which wrote geometry.faceVertexUvs by hand and
 * divided each part by its own bounding box. That stretched a single photograph
 * over the whole of whatever it was given, so a three-metre kicker's grain came
 * out six times coarser than a half-metre one's. Reading straight from position
 * means a longer ramp gets more grain rather than bigger grain.
 *
 * Each vertex is projected along the axis its normal points down, so the
 * plywood faces, the thin edges around them and the struts' six sides all come
 * out at the same scale. The geometries here are flat shaded, so the three
 * vertices of a triangle always agree on that axis and the choice cannot split
 * one.
 */
export function applyBoxUv(geometry: BufferGeometry, tile: number): void {
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  const uv = new Float32Array(position.count * 2);

  for (let i = 0; i < position.count; i++) {
    const nx = Math.abs(normal.getX(i));
    const ny = Math.abs(normal.getY(i));
    const nz = Math.abs(normal.getZ(i));

    // The two axes the face spans are the two its normal does not.
    const [u, v] =
      nx > ny && nx > nz
        ? [position.getZ(i), position.getY(i)]
        : ny > nz
          ? [position.getX(i), position.getZ(i)]
          : [position.getX(i), position.getY(i)];

    uv[i * 2] = u / tile;
    uv[i * 2 + 1] = v / tile;
  }

  geometry.setAttribute("uv", new BufferAttribute(uv, 2));
}

/**
 * Projects the grain onto the riding surface along the arc, rather than across
 * the box the arc fits in.
 *
 * How high a point on the deck sits says little about how far along the ramp it
 * is: down at the run-out the surface is nearly flat, so a metre of travel
 * gains a centimetre of height. Taking v from y — which is what a planar
 * projection does — therefore smears one row of pixels over the whole approach.
 * The angle subtended at the arc's centre gives the distance actually covered.
 *
 * The arc is centred at (0, radius), the frame calculateSurfacePoints works in.
 * Its offset outer face keeps the angle of the inner point it was offset from,
 * so the grain carries over the lip and down the underside, and the two ends
 * collapse to a single column — 15mm of ply, where nobody will look for a seam.
 */
export function applyArcUv(geometry: BufferGeometry, radius: number, tile: number): void {
  const position = geometry.getAttribute("position");
  const uv = new Float32Array(position.count * 2);

  for (let i = 0; i < position.count; i++) {
    const angle = Math.atan2(position.getX(i), radius - position.getY(i));
    uv[i * 2] = position.getZ(i) / tile;
    uv[i * 2 + 1] = (radius * angle) / tile;
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
