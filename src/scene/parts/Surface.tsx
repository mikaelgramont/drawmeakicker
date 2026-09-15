"use client";

import { kickerConfig, type Point2 } from "@/lib/kicker";
import { TEXTURES, WOOD_TILE } from "../constants";
import { applyArcUv, extrudeProfile } from "../geometry";
import { useGeometry } from "../use-geometry";
import type { SceneVisibility } from "../visibility";
import { useWood } from "../wood";
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
  radius,
  width,
  visibility,
}: {
  points: readonly Point2[];
  /** The arc the deck follows, which is what its grain is measured along. */
  radius: number;
  width: number;
  visibility: SceneVisibility;
}) {
  const texture = useWood(TEXTURES.side);
  const depth = width + OVERHANG;

  const geometry = useGeometry(() => {
    const geometry = extrudeProfile(points, depth);
    geometry.translate(0, 0, -depth / 2);
    // Mapped after centring, so that the tiles fall symmetrically either side
    // of the ramp's middle and widening it does not slide the grain sideways.
    applyArcUv(geometry, radius, WOOD_TILE);
    return geometry;
  }, [points, radius, depth]);

  return <Timber geometry={geometry} texture={texture} visibility={visibility} />;
}
