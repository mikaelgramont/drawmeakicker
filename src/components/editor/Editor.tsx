"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { composeExport, type ExportOptions } from "@/lib/export-image";
import { buildPdf } from "@/lib/pdf/document";
import { captureThreeDee } from "@/lib/pdf/three-dee";
import { hasServer, saveDataUrl } from "@/lib/runtime";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { Renderer, type RendererCanvases } from "@/components/renderer/Renderer";
import type { RenderNow } from "@/scene/ExportBridge";
import { xrStore } from "@/scene/xr";
import { useEditorStore, useVisibleSteps, type Step } from "@/store/editor-store";
import { Accordion, Fieldset, type AccordionStep } from "./Accordion";
import { ControlButtons } from "./ControlButtons";
import { ExportContext, type ExportActions } from "./export-context";
import { Toolbar } from "./Toolbar";
import { ContextPanel } from "./panels/ContextPanel";
import { ExportPanel } from "./panels/ExportPanel";
import { LibraryPanel } from "./panels/LibraryPanel";
import { ParametersPanel } from "./panels/ParametersPanel";
import { PdfPanel } from "./panels/PdfPanel";
import { ResultsPanel } from "./panels/ResultsPanel";
import { NotesPanel, SavePanel } from "./panels/SavePanel";
import { SharePanel } from "./panels/SharePanel";
import styles from "./editor.module.css";

/*
 * Built as a function rather than a constant because two entries change
 * shape when `hasServer()` is false: the third step drops its "Share with
 * friends" fieldset and calls itself "Info" rather than "Share". The runtime
 * flag is set before anything renders, so reading it here is safe.
 */
function buildStepDefinitions(): Record<Step, Omit<AccordionStep, "id">> {
  const serverBacked = hasServer();
  return {
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
          <Fieldset legend="Build plan">
            <PdfPanel />
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
    // Only reachable once a kicker has been saved or loaded. On the web that
    // means it has an id worth sharing; on the desktop it just means there
    // are notes to attach, which is why the caption changes.
    share: {
      caption: serverBacked ? "Share" : "Info",
      displayNumber: 3,
      content: (
        <>
          <Fieldset legend="Notes">
            <NotesPanel />
          </Fieldset>
          {serverBacked && (
            <Fieldset legend="Share with friends">
              <SharePanel />
            </Fieldset>
          )}
        </>
      ),
    },
    library: {
      caption: "Saved",
      displayNumber: 4,
      content: (
        <Fieldset legend="On this device">
          <LibraryPanel />
        </Fieldset>
      ),
    },
  };
}

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

      saveDataUrl(
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

  /*
   * PDF build plan. Temporarily flips the visualization to a plain outline-only
   * 3D view long enough to capture a snapshot for page one, then restores it —
   * so what the user was looking at is what they get back once the file has
   * been offered. Any throw is left to the caller (`PdfPanel`) to surface, but
   * the restore in `finally` runs regardless.
   */
  const exportPlan = useCallback(async () => {
    if (!content.current) {
      throw new Error("The scene is not ready yet.");
    }
    const renderer = renderNow.current;
    if (!renderer) {
      throw new Error("The scene is not ready yet.");
    }

    const { kicker, savedId, units } = useEditorStore.getState();
    const previous = {
      repType: kicker.repType,
      textured: kicker.textured,
      annotations: kicker.annotations,
      grid: kicker.grid,
      mountainboard: kicker.mountainboard,
      rider: kicker.rider,
    };
    const setVisualization = useEditorStore.getState().setVisualization;

    try {
      const snapshot = await captureThreeDee({
        applyPatch: (patch) => setVisualization(patch),
        renderNow: renderer,
        canvas: content.current,
      });

      const { dataUrl, filename } = await buildPdf({
        kicker: useEditorStore.getState().kicker,
        savedId,
        units,
        snapshot,
      });

      saveDataUrl(dataUrl, filename);
    } finally {
      setVisualization(previous);
    }
  }, []);

  const exports: ExportActions = useMemo(
    () => ({ exportImage, exportPlan }),
    [exportImage, exportPlan],
  );

  const stepDefinitions = useMemo(buildStepDefinitions, []);
  const steps = visibleSteps.map((id) => ({ id, ...stepDefinitions[id] }));

  return (
    <ExportContext.Provider value={exports}>
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
