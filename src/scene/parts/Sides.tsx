"use client";

import { kickerConfig, type Point2 } from "@/lib/kicker";
import { TEXTURES, WOOD_TILE } from "../constants";
import { applyBoxUv, extrudeProfile } from "../geometry";
import { useGeometry } from "../use-geometry";
import type { SceneVisibility } from "../visibility";
import { useWood } from "../wood";
import { Timber } from "./Timber";

/**
 * The two plywood cheeks. One profile, extruded to sheet thickness and centred
 * on each side of the ramp.
 */
export function Sides({
  points,
  width,
  visibility,
}: {
  points: readonly Point2[];
  width: number;
  visibility: SceneVisibility;
}) {
  const texture = useWood(TEXTURES.side);
  const { thickness } = kickerConfig.sides;

  const geometry = useGeometry(() => {
    const geometry = extrudeProfile(points, thickness);
    // Extrusion runs from z=0 to z=thickness, so pull it back by half to
    // straddle the requested plane.
    geometry.translate(0, 0, -thickness / 2);
    applyBoxUv(geometry, WOOD_TILE);
    return geometry;
  }, [points, thickness]);

  return (
    <>
      <group position={[0, 0, width / 2]}>
        <Timber geometry={geometry} texture={texture} visibility={visibility} />
      </group>
      <group position={[0, 0, -width / 2]}>
        <Timber geometry={geometry} texture={texture} visibility={visibility} />
      </group>
    </>
  );
}
