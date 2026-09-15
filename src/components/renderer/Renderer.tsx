"use client";

import { Suspense, useCallback, useMemo, useState, type RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import { XR } from "@react-three/xr";
import type { Object3D } from "three";
import { calculateResults } from "@/lib/kicker";
import { useEditorStore } from "@/store/editor-store";
import { Cameras } from "@/scene/Cameras";
import { ExportBridge, type RenderNow } from "@/scene/ExportBridge";
import { Kicker } from "@/scene/Kicker";
import { xrStore } from "@/scene/xr";
import { BlueprintBorder } from "./BlueprintBorder";
import styles from "./renderer.module.css";

export interface RendererCanvases {
  content: RefObject<HTMLCanvasElement | null>;
  border: RefObject<HTMLCanvasElement | null>;
  merge: RefObject<HTMLCanvasElement | null>;
  renderNow: RefObject<RenderNow | null>;
}

/**
 * The three stacked canvases that make up the drawing: the WebGL scene, the
 * blueprint frame, and a hidden one used to composite exports.
 *
 * Replaces bihi-renderer3d.html together with renderer3d.js. The Sequencer's
 * once/continuous/done render loop is gone: `frameloop="demand"` is the same
 * idea built into react-three-fiber, and it switches to a continuous loop only
 * while a headset is driving the camera.
 */
export function Renderer({ canvases }: { canvases: RendererCanvases }) {
  const kicker = useEditorStore((state) => state.kicker);
  const units = useEditorStore((state) => state.units);
  const vrActive = useEditorStore((state) => state.vrActive);

  /*
   * State rather than a ref: the kicker suspends on its textures, so the group
   * only mounts on a later commit. The 2D camera has nothing to frame until it
   * does, and needs a re-render to hear about it.
   */
  const [content, setContent] = useState<Object3D | null>(null);

  const is3d = kicker.repType === "3d";
  const { length } = useMemo(
    () => calculateResults(kicker.height, kicker.angle),
    [kicker.height, kicker.angle],
  );

  const registerRenderNow = useCallback(
    (render: RenderNow | null) => {
      canvases.renderNow.current = render;
    },
    [canvases],
  );

  return (
    <div className={`${styles.renderer} blueprint`}>
      <div className={`${styles.layer} ${styles.content}`}>
        <Canvas
          ref={canvases.content}
          frameloop={vrActive ? "always" : "demand"}
          gl={{
            antialias: true,
            alpha: true,
            // Required to read pixels back out for the PNG export.
            preserveDrawingBuffer: true,
          }}
        >
          <XR store={xrStore}>
            {/* Two hard lights, no ambient: matches EditorScene.getScene. */}
            <directionalLight position={[300, 10, 300]} />
            <directionalLight position={[-100, 200, -120]} />

            <Suspense fallback={null}>
              <Kicker kicker={kicker} units={units} contentRef={setContent} />
            </Suspense>

            <Cameras
              is3d={is3d}
              orbitEnabled={!vrActive}
              target={[length / 2, 0, 0]}
              content={content}
              labelled={kicker.annotations}
            />

            <ExportBridge onReady={registerRenderNow} />
          </XR>
        </Canvas>
      </div>

      <div className={styles.layer}>
        <BlueprintBorder canvasRef={canvases.border} className={styles.borderCanvas} />
      </div>

      <canvas ref={canvases.merge} className={styles.mergeCanvas} aria-hidden />
    </div>
  );
}
