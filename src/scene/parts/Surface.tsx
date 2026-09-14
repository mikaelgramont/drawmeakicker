"use client";

import { useTexture } from "@react-three/drei";
import { kickerConfig, type Point2 } from "@/lib/kicker";
import { TEXTURES } from "../constants";
import { applyPlanarUv, extrudeProfile } from "../geometry";
import { useGeometry } from "../use-geometry";
import type { SceneVisibility } from "../visibility";
import { Timber } from "./Timber";

/**
 * A hair of extra width so the deck visibly laps over the side panels instead
 * of z-fighting with them. Two odd constants from the original, preserved:
 * Representation3D.buildSurface added `2 * sides.thickness / 60`, and the
 * Surface part then added `sides.thickness * 2` on top.
 */
const OVERHANG = (2 * kickerConfig.sides.thickness) / 60 + kickerConfig.sides.thickness * 2;

/** The riding surface: the arc swept across the full width of the ramp. */
export function Surface({
  points,
  width,
  visibility,
}: {
  points: readonly Point2[];
  width: number;
  visibility: SceneVisibility;
}) {
  const texture = useTexture(TEXTURES.side);
  const depth = width + OVERHANG;

  const geometry = useGeometry(() => {
    const geometry = extrudeProfile(points, depth);
    // Across the ramp rather than along it: the grain should run with the
    // slats, so u comes from z.
    applyPlanarUv(geometry, "z", "y");
    geometry.translate(0, 0, -depth / 2);
    return geometry;
  }, [points, depth]);

  return <Timber geometry={geometry} texture={texture} visibility={visibility} />;
}
