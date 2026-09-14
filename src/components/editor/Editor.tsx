"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { composeExport, downloadDataUrl, type ExportOptions } from "@/lib/export-image";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { Renderer, type RendererCanvases } from "@/components/renderer/Renderer";
import type { RenderNow } from "@/scene/ExportBridge";
import { xrStore } from "@/scene/xr";
import { useEditorStore, useVisibleSteps, type Step } from "@/store/editor-store";
import { Accordion, Fieldset, type AccordionStep } from "./Accordion";
import { ControlButtons } from "./ControlButtons";
import { ExportContext } from "./export-context";
import { Toolbar } from "./Toolbar";
import { ContextPanel } from "./panels/ContextPanel";
import { ExportPanel } from "./panels/ExportPanel";
import { ParametersPanel } from "./panels/ParametersPanel";
import { ResultsPanel } from "./panels/ResultsPanel";
import { NotesPanel, SavePanel } from "./panels/SavePanel";
import styles from "./editor.module.css";

const STEP_DEFINITIONS: Record<Step, Omit<AccordionStep, "id">> = {
  design: {
    caption: "Design",
    displayNumber: 1,
    content: (
      <>
        <ControlButtons />
        <Fieldset legend="Parameters">
          <ParametersPanel />
        </Fieldset>
        <Fieldset legend="Results">
          <ResultsPanel />
        </Fieldset>
      </>
    ),
  },
  visualize: {
    caption: "Visualize",
    displayNumber: 2,
    content: (
      <>
        <Fieldset legend="Context">
          <ContextPanel />
        </Fieldset>
        <Fieldset legend="Image export">
          <ExportPanel />
        </Fieldset>
      </>
    ),
  },
  save: {
    caption: "Save",
    displayNumber: 3,
    content: (
      <Fieldset legend="Information">
        <SavePanel />
      </Fieldset>
    ),
  },
  // Only reachable once a kicker has been saved or loaded, so unreachable in
  // Phase 1. The share buttons themselves are out of scope.
  share: {
    caption: "Share",
    displayNumber: 3,
    content: (
      <Fieldset legend="Notes">
        <NotesPanel />
      </Fieldset>
    ),
  },
};

/**
 * The editor: stepped sidebar on the left, drawing on the right.
 *
 * Replaces bihi-editor.html, which coordinated its children by firing custom
 * events at element references it had looked up by id.
 */
export function Editor() {
  const step = useEditorStore((state) => state.step);
  const goToStep = useEditorStore((state) => state.goToStep);
  const sidebarOpen = useEditorStore((state) => state.sidebarOpen);
  const setSidebarOpen = useEditorStore((state) => state.setSidebarOpen);
  const visibleSteps = useVisibleSteps();
  const vrActive = useEditorStore((state) => state.vrActive);
  const setVrActive = useEditorStore((state) => state.setVrActive);

  // The headset owns the session lifecycle, including the user backing out of
  // it, so mirror it into the store rather than tracking it from the button.
  useEffect(
    () => xrStore.subscribe((state) => setVrActive(state.session != null)),
    [setVrActive],
  );

  useWakeLock(vrActive);

  const content = useRef<HTMLCanvasElement | null>(null);
  const border = useRef<HTMLCanvasElement | null>(null);
  const merge = useRef<HTMLCanvasElement | null>(null);
  const renderNow = useRef<RenderNow | null>(null);
  const canvases: RendererCanvases = useMemo(
    () => ({ content, border, merge, renderNow }),
    [],
  );

  const exportImage = useCallback(
    (options: ExportOptions) => {
      if (!content.current || !border.current || !merge.current) return;

      // The scene only draws on demand, so make sure the buffer is current.
      renderNow.current?.();

      downloadDataUrl(
        composeExport({
          target: merge.current,
          content: content.current,
          border: border.current,
          options,
          devicePixelRatio: window.devicePixelRatio || 1,
        }),
        "kicker.png",
      );
    },
    [],
  );

  const steps = visibleSteps.map((id) => ({ id, ...STEP_DEFINITIONS[id] }));

  return (
    <ExportContext.Provider value={exportImage}>
      <div className={styles.editor}>
        {sidebarOpen && (
          <div
            className={styles.mask}
            role="presentation"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Accordion
          steps={steps}
          current={step}
          onSelect={goToStep}
          className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""} blueprint`}
        />

        <div className={styles.rendererContainer}>
          <Toolbar />
          <Renderer canvases={canvases} />
        </div>
      </div>
    </ExportContext.Provider>
  );
}
