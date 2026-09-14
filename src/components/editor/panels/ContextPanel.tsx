"use client";

import { useEditorStore } from "@/store/editor-store";
import styles from "./panels.module.css";

/** What to draw around the ramp. Ported from bihi-context. */
export function ContextPanel() {
  const { annotations, grid, mountainboard } = useEditorStore((state) => state.kicker);
  const setVisualization = useEditorStore((state) => state.setVisualization);

  return (
    <div className={`${styles.checkboxes} size-2`}>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={annotations}
          onChange={(event) => setVisualization({ annotations: event.target.checked })}
        />
        <span>Annotations</span>
      </label>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={grid}
          onChange={(event) => setVisualization({ grid: event.target.checked })}
        />
        <span>Grid (3d only)</span>
      </label>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={mountainboard}
          onChange={(event) => setVisualization({ mountainboard: event.target.checked })}
        />
        <span>Mountainboard</span>
      </label>
      {/*
        The `rider` flag is persisted and round-trips through the editor, but
        nothing in the scene consumes it and its checkbox was already hidden in
        the original, so it is not offered here.
      */}
    </div>
  );
}
