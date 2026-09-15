"use client";

import { BoxGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { StrutPlacement } from "@/lib/kicker";
import { TEXTURES, WOOD_TILE } from "../constants";
import { applyBoxUv } from "../geometry";
import { useGeometry } from "../use-geometry";
import type { SceneVisibility } from "../visibility";
import { useWood } from "../wood";
import { Timber } from "./Timber";

/**
 * The cross-braces under the deck.
 *
 * All struts are merged into one geometry: they are never moved or textured
 * independently, and a single buffer means one draw call and one outline pass
 * instead of a dozen. The legacy app built a mesh per strut.
 */
export function Struts({
  placements,
  radius,
  width,
  visibility,
}: {
  placements: readonly StrutPlacement[];
  radius: number;
  width: number;
  visibility: SceneVisibility;
}) {
  const texture = useWood(TEXTURES.strut);

  const geometry = useGeometry(() => {
    const parts = placements.map((placement) => {
      const box = new BoxGeometry(placement.thickness, placement.thickness, width);

      if (placement.kind === "curve") {
        // Swing the box about the arc's centre so it sits square against the
        // underside of the deck: drop to the centre, rotate, lift back.
        box.translate(0, -(radius + placement.thickness / 2), 0);
        box.rotateZ(placement.angleRad);
        box.translate(0, radius, 0);
      } else {
        box.translate(placement.offset[0], placement.offset[1], 0);
      }

      return box;
    });

    const merged = mergeGeometries(parts);
    for (const part of parts) part.dispose();
    // After merging, so that every strut is projected in the assembly's frame
    // and the grain runs on through from one to the next.
    applyBoxUv(merged, WOOD_TILE);
    return merged;
  }, [placements, radius, width]);

  return <Timber geometry={geometry} texture={texture} visibility={visibility} />;
}
