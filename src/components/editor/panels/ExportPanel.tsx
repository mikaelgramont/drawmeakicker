"use client";

import { useEditorStore } from "@/store/editor-store";
import { useExportImage } from "../export-context";
import styles from "./panels.module.css";

/** PNG export options and trigger. Ported from bihi-export. */
export function ExportPanel() {
  const { fill, borders } = useEditorStore((state) => state.kicker);
  const setVisualization = useEditorStore((state) => state.setVisualization);
  const exportImage = useExportImage();

  return (
    <div className={`${styles.checkboxes} size-2`}>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={fill}
          onChange={(event) => setVisualization({ fill: event.target.checked })}
        />
        <span>Background color</span>
      </label>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={borders}
          onChange={(event) => setVisualization({ borders: event.target.checked })}
        />
        <span>Borders</span>
      </label>
      <div className={styles.buttonRow}>
        <button type="button" onClick={() => exportImage({ fill, borders })}>
          Export
        </button>
      </div>
    </div>
  );
}
