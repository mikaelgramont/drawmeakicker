"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, type RefObject } from "react";
import { OUTLINE_COLOR } from "@/scene/constants";

const ROWS = 4;
const COLUMNS = 4;
const NOTCH_LENGTH = 10;

/**
 * Draws the technical-drawing frame: a border with tick marks dividing each
 * edge into quarters. Ported from BlueprintBorderRenderer.
 *
 * Unlike the original this renders at device resolution rather than CSS
 * resolution, so the frame is crisp on hi-dpi screens and in the PNG export.
 */
function paint(canvas: HTMLCanvasElement): void {
  const parent = canvas.parentElement;
  if (!parent) return;

  const dpr = window.devicePixelRatio || 1;
  const width = parent.clientWidth;
  const height = parent.clientHeight;

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  const context = canvas.getContext("2d");
  if (!context) return;

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  context.strokeStyle = OUTLINE_COLOR;
  context.lineWidth = 1;

  // Half-pixel offsets so a 1px stroke lands on a pixel instead of straddling two.
  context.strokeRect(0.5, 0.5, width - 1, height - 1);

  const columnSpacing = (width - (COLUMNS - 1) - 2) / COLUMNS;
  for (let i = 1; i < COLUMNS; i++) {
    const x = Math.trunc(columnSpacing * i) + 0.5;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, NOTCH_LENGTH);
    context.moveTo(x, height);
    context.lineTo(x, height - NOTCH_LENGTH);
    context.stroke();
  }

  const rowSpacing = (height - (ROWS - 1) - 2) / ROWS;
  for (let i = 1; i < ROWS; i++) {
    const y = Math.trunc(rowSpacing * i) + 0.5;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(NOTCH_LENGTH, y);
    context.moveTo(width, y);
    context.lineTo(width - NOTCH_LENGTH, y);
    context.stroke();
  }
}

export interface BlueprintBorderHandle {
  redraw(): void;
}

export function BlueprintBorder({
  canvasRef,
  handleRef,
  className,
}: {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  handleRef?: RefObject<BlueprintBorderHandle | null>;
  className?: string;
}) {
  const ownRef = useRef<HTMLCanvasElement | null>(null);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current ?? ownRef.current;
    if (canvas) paint(canvas);
  }, [canvasRef]);

  useImperativeHandle(handleRef, () => ({ redraw }), [redraw]);

  useEffect(() => {
    redraw();
    const observer = new ResizeObserver(redraw);
    const parent = (canvasRef.current ?? ownRef.current)?.parentElement;
    if (parent) observer.observe(parent);
    return () => observer.disconnect();
  }, [canvasRef, redraw]);

  return (
    <canvas
      ref={(node) => {
        ownRef.current = node;
        canvasRef.current = node;
      }}
      className={className}
      aria-hidden
    />
  );
}
