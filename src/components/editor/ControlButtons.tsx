"use client";

import { startDerivative, useEditorStore } from "@/store/editor-store";
import styles from "./controls.module.css";

/**
 * Modify / New, ported from bihi-controlbuttons.
 *
 * Modify only appears while viewing someone else's kicker, where it keeps the
 * dimensions but drops the id so the parameters unlock and a save will mint a
 * new one. The original achieved the reset with a pair of state transitions
 * queued through setTimeout; the store does it in one call.
 */
export function ControlButtons() {
  const mode = useEditorStore((state) => state.mode);
  const resetToDefaults = useEditorStore((state) => state.resetToDefaults);

  return (
    <div className={styles.controlButtons}>
      {mode === "readOnly" && (
        <button type="button" className="small" onClick={startDerivative}>
          Modify
        </button>
      )}
      <button type="button" className="small" onClick={resetToDefaults}>
        New
      </button>
    </div>
  );
}
