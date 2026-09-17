"use client";

import { createContext, useContext } from "react";
import type { ExportOptions } from "@/lib/export-image";

export type ExportImage = (options: ExportOptions) => void;

/**
 * Kicks off a two-page PDF build plan and hands it to the runtime seam. Async
 * because it lazily imports jsPDF and pauses a frame to capture the 3D view.
 * Resolves when the file has been offered to the user; rejects on any error
 * so the panel can surface it.
 */
export type ExportPlan = () => Promise<void>;

export interface ExportActions {
  exportImage: ExportImage;
  exportPlan: ExportPlan;
}

/**
 * Lets the export panels trigger a render, composite or PDF build without
 * knowing about the canvases. The legacy app did this by bouncing a
 * `renderer-event` custom event off document.body.
 */
export const ExportContext = createContext<ExportActions | null>(null);

function useExports(): ExportActions {
  const actions = useContext(ExportContext);
  if (!actions) {
    throw new Error("Export hooks must be used inside the editor");
  }
  return actions;
}

export function useExportImage(): ExportImage {
  return useExports().exportImage;
}

export function useExportPlan(): ExportPlan {
  return useExports().exportPlan;
}
