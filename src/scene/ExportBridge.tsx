"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

/** Forces a fresh frame into the drawing buffer. */
export type RenderNow = () => void;

/**
 * Hands a synchronous render callback out of the canvas.
 *
 * The scene only draws on demand, so by the time the user clicks Export the
 * drawing buffer may hold a frame from several parameter changes ago.
 * Rendering immediately before compositing guarantees the PNG matches what is
 * on screen.
 */
export function ExportBridge({ onReady }: { onReady: (render: RenderNow | null) => void }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    onReady(() => gl.render(scene, camera));
    return () => onReady(null);
  }, [gl, scene, camera, onReady]);

  return null;
}
