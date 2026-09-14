"use client";

import { useEditorStore } from "@/store/editor-store";
import styles from "./controls.module.css";

/**
 * Modify / New, ported from bihi-controlbuttons.
 *
 * Modify only appears while viewing someone else's kicker, where it unlocks
 * the parameters to start a derivative design. The original achieved the reset
 * with a pair of state transitions queued through setTimeout; the store does
 * it in one call.
 */
export function ControlButtons() {
  const mode = useEditorStore((state) => state.mode);
  const resetToDefaults = useEditorStore((state) => state.resetToDefaults);
  const setMode = useEditorStore((state) => state.setMode);

  return (
    <div className={styles.controlButtons}>
      {mode === "readOnly" && (
        <button type="button" className="small" onClick={() => setMode("ready")}>
          Modify
        </button>
      )}
      <button type="button" className="small" onClick={resetToDefaults}>
        New
      </button>
    </div>
  );
}
