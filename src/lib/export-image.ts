/** Matches --color-light-blue, the blueprint paper colour. */
const FILL_COLOR = "#3b69d5";

/** Width of the blueprint margin around the drawing, in CSS pixels. */
export const EXPORT_INSET = 10;

export interface ExportOptions {
  /** Paint the blueprint background instead of leaving it transparent. */
  fill: boolean;
  /** Include the notched blueprint frame. */
  borders: boolean;
}

/**
 * Composites the 3D canvas and the blueprint frame into one image.
 *
 * Ported from MergedRenderer. The original drew the 3D canvas at a 10px offset
 * but at the full merged size, so the drawing overhung the bottom-right by
 * 10px and did not line up with the frame; both layers now share one rect, and
 * offsets are scaled by the device pixel ratio like the canvases themselves.
 */
export function composeExport({
  target,
  content,
  border,
  options,
  devicePixelRatio,
}: {
  target: HTMLCanvasElement;
  content: HTMLCanvasElement;
  border: HTMLCanvasElement;
  options: ExportOptions;
  devicePixelRatio: number;
}): string {
  const inset = EXPORT_INSET * devicePixelRatio;
  const width = content.width;
  const height = content.height;

  target.width = width + 2 * inset;
  target.height = height + 2 * inset;

  const context = target.getContext("2d");
  if (!context) throw new Error("Could not get a 2D context for the export canvas");

  context.clearRect(0, 0, target.width, target.height);

  if (options.fill) {
    context.fillStyle = FILL_COLOR;
    context.fillRect(0, 0, target.width, target.height);
  }

  context.drawImage(content, inset, inset, width, height);

  if (options.borders) {
    context.drawImage(border, inset, inset, width, height);
  }

  return target.toDataURL("image/png");
}

/** Triggers a browser download for a data URL. */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
}
