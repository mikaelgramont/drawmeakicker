"use client";

import { useCallback } from "react";
import { useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { RepeatWrapping, type Texture } from "three";

/**
 * Loads one of the wood photographs, ready to tile over a part.
 *
 * The UVs are in world units (see applyBoxUv), so they run well past 1 on
 * anything larger than a tile, and the default clamp would smear the texture's
 * outermost pixels over the whole of the rest of the part.
 *
 * None of the three photographs is seamless — across wood1's join, neighbouring
 * columns of pixels differ about seven times as much as they do anywhere within
 * it — so repeating draws a visible line every WOOD_TILE metres. On a ramp built
 * out of sheets that is a tolerable thing to see, and the tile is a sheet's
 * width for that reason. Making the photographs tile properly is the fix if the
 * lines start to grate.
 *
 * Anisotropic filtering matters more than it did: a ramp now shows several tiles
 * of grain rather than one stretched copy, and the deck is seen at a glancing
 * angle, which is exactly where trilinear filtering alone turns wood into fog.
 */
export function useWood(url: string): Texture {
  const anisotropy = useThree((state) => state.gl.capabilities.getMaxAnisotropy());

  const setup = useCallback(
    (texture: Texture) => {
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.anisotropy = anisotropy;
    },
    [anisotropy],
  );

  return useTexture(url, setup);
}
