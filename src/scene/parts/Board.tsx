"use client";

import { useGLTF } from "@react-three/drei";
import { BOARD_MODEL } from "../constants";

/**
 * The mountainboard, for a sense of scale. Parked alongside the ramp.
 *
 * Placement matches the legacy Board part. It has to go on a wrapper group:
 * the GLB root node carries the Collada Z_UP -> Y_UP rotation baked in by
 * scripts/dae-to-glb.ts, and setting rotation on the loaded scene would
 * discard it and lay the board on its side.
 */
export function Board({ width, visible }: { width: number; visible: boolean }) {
  const { scene } = useGLTF(BOARD_MODEL);

  return (
    <group
      visible={visible}
      position={[0.5, 0.1, width / 2 + 1]}
      rotation={[0, (10 * Math.PI) / 64, 0]}
      scale={0.5}
    >
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(BOARD_MODEL);
