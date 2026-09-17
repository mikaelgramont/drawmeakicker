/** A 3D snapshot with the pixel dimensions of the source it came from. */
export interface ThreeDeeSnapshot {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Turning the editor's 3D view into a black-on-white print.
 *
 * The scene draws white outlines on a transparent canvas — that is what the
 * blueprint look on screen is, once you strip the dark-blue paper behind it.
 * The PDF wants exactly the opposite: black lines on white. Doing the
 * inversion as a `<canvas>` post-process rather than re-rendering with a
 * different material lets the export reuse the same drawing buffer the editor
 * already fills for the PNG export, so the print matches what is on screen.
 *
 * Implemented with `globalCompositeOperation = "difference"`, which computes
 * `|dest - source|` per pixel and leaves the destination untouched where the
 * source is transparent. Filling white first and drawing white-over-white
 * therefore turns every drawn line black and leaves everywhere else white,
 * which is the result we want in one pass without touching pixel data.
 */
export function invertOnWhite(source: HTMLCanvasElement): ThreeDeeSnapshot {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not get a 2D context for the 3D snapshot");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = "difference";
  context.drawImage(source, 0, 0);
  context.globalCompositeOperation = "source-over";

  return {
    dataUrl: canvas.toDataURL("image/png"),
    width: canvas.width,
    height: canvas.height,
  };
}

/**
 * The visualization the 3D snapshot needs the editor to be in: perspective
 * view, outlines only, no annotations, no scene props. The caller is expected
 * to save the visualization it finds and restore it once the capture is done.
 *
 * Kept as a plain object rather than a helper on the store so it survives
 * being read from a callback without a render — the export happens in a
 * one-shot outside React's commit cycle.
 */
export const SNAPSHOT_VISUALIZATION = {
  repType: "3d",
  textured: false,
  annotations: false,
  grid: false,
  mountainboard: false,
  rider: false,
} as const;

/**
 * Yields long enough for React to commit a store change and for
 * react-three-fiber's `frameloop="demand"` to run its useLayoutEffects.
 *
 * Two `requestAnimationFrame` calls: the first lets the commit happen, the
 * second lets any effects that scheduled work after the commit finish (like
 * the 2D camera fit that runs on every commit). One would be enough on paper;
 * two is what makes it work in practice, and the cost is a hair under 33ms.
 */
function nextTwoFrames(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

/**
 * Reads the outline-only 3D view out of the editor's own canvas.
 *
 * `applyPatch` sets the visualization, `renderNow` forces a synchronous frame
 * (both already exposed to the export panel), and `canvas` is the WebGL
 * canvas the scene renders into. The caller is responsible for restoring the
 * visualization once this resolves — nothing here undoes the patch, because
 * the caller has one to hand and this module has no store to touch.
 */
export async function captureThreeDee({
  applyPatch,
  renderNow,
  canvas,
}: {
  applyPatch(patch: typeof SNAPSHOT_VISUALIZATION): void;
  renderNow(): void;
  canvas: HTMLCanvasElement;
}): Promise<ThreeDeeSnapshot> {
  applyPatch(SNAPSHOT_VISUALIZATION);
  await nextTwoFrames();
  renderNow();
  return invertOnWhite(canvas);
}
