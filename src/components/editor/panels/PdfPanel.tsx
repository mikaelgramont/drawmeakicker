"use client";

import { useState } from "react";
import { useExportPlan } from "../export-context";
import styles from "./panels.module.css";

/**
 * The Export PDF button and its transient status. The whole build is
 * asynchronous — jsPDF is imported lazily, and the 3D snapshot waits a frame
 * to render — so this component owns two bits of local state, "busy" and
 * "error", rather than reaching back into the editor store for them.
 */
export function PdfPanel() {
  const exportPlan = useExportPlan();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setError(null);
    setBusy(true);
    try {
      await exportPlan();
    } catch (thrown: unknown) {
      const message = thrown instanceof Error ? thrown.message : "Something went wrong.";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${styles.checkboxes} size-2`}>
      <p className={styles.note}>
        A two-page PDF: the measurements and cut list on page one, the
        annotated side view on page two.
      </p>
      <div className={styles.buttonRow}>
        <button type="button" onClick={onClick} disabled={busy}>
          {busy ? "Building\u2026" : "Export PDF"}
        </button>
      </div>
      {error && (
        <p className={`${styles.note} size-2`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
