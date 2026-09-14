"use client";

import { createContext, useContext } from "react";
import type { ExportOptions } from "@/lib/export-image";

export type ExportImage = (options: ExportOptions) => void;

/**
 * Lets the export panel trigger a render and composite without knowing about
 * the canvases. The legacy app did this by bouncing a `renderer-event` custom
 * event off document.body.
 */
export const ExportContext = createContext<ExportImage | null>(null);

export function useExportImage(): ExportImage {
  const exportImage = useContext(ExportContext);
  if (!exportImage) {
    throw new Error("useExportImage must be used inside the editor");
  }
  return exportImage;
}
