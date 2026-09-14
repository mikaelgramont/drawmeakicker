"use client";

import { Edges } from "@react-three/drei";
import type { BufferGeometry, Texture } from "three";
import { EDGE_THRESHOLD_DEGREES, OUTLINE_COLOR } from "../constants";
import type { SceneVisibility } from "../visibility";

/**
 * A piece of timber, drawn either as textured solid or as a white outline.
 *
 * This is Part.setMeshVisibilityForDisplay from the legacy app: every wooden
 * part had a 2d/3d mesh pair and flipped `.visible` between them. The pair
 * lives here so the sides, surface and struts share one definition.
 *
 * The outline is a sibling rather than a child of the mesh because three's
 * visibility is hierarchical: nested under a hidden mesh it would never show.
 */
export function Timber({
  geometry,
  texture,
  visibility,
}: {
  geometry: BufferGeometry;
  texture: Texture;
  visibility: SceneVisibility;
}) {
  return (
    <>
      <mesh geometry={geometry} visible={visibility.solid}>
        <meshLambertMaterial map={texture} />
      </mesh>
      <Edges
        geometry={geometry}
        visible={visibility.outline}
        threshold={EDGE_THRESHOLD_DEGREES}
        color={OUTLINE_COLOR}
        lineWidth={visibility.outlineWidth}
      />
    </>
  );
}
