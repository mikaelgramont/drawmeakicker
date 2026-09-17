"use client";

import { syncNow } from "@/hooks/use-outbox";
import { requestPersistentStorage, saveDesign, SAVE_FAILED } from "@/lib/local/designs";
import { hasServer } from "@/lib/runtime";
import { useEditorStore } from "@/store/editor-store";
import styles from "./panels.module.css";

/**
 * Title and description for a kicker, ported from bihi-save.
 *
 * Pressing Save writes to the local library and moves straight on to Share.
 * It used to post to /api/kickers and wait, which meant a save could fail: an
 * outage or a 500 left the user on this step holding an error message and
 * nothing kept. Now the only way this fails is the device being out of room,
 * and reaching the server is the outbox's problem.
 */
export function SavePanel() {
  const { title, description } = useEditorStore((state) => state.kicker);
  const setSaveFields = useEditorStore((state) => state.setSaveFields);
  const saving = useEditorStore((state) => state.saving);
  const setSaving = useEditorStore((state) => state.setSaving);
  const markSavedLocally = useEditorStore((state) => state.markSavedLocally);
  const setAlert = useEditorStore((state) => state.setAlert);

  async function onSave() {
    setSaving(true);
    try {
      // Read the kicker here rather than subscribing to it: this panel would
      // otherwise re-render on every drag of a parameter slider.
      const design = await saveDesign(useEditorStore.getState().kicker);
      markSavedLocally(design);

      /*
       * Asked for on the first save rather than at start-up, both because it is
       * the first moment there is anything to lose and because the browsers
       * that prompt will be asking about something the user just did.
       */
      void requestPersistentStorage();
      // Nothing to push to if the shell has no server behind it; the design
      // is already where it belongs, which is this device.
      if (hasServer()) void syncNow();
    } catch (error) {
      setSaving(false);
      setAlert(error instanceof Error ? error.message : SAVE_FAILED);
    }
  }

  return (
    <div className="size-2">
      <label className={styles.field} htmlFor="kicker-title">
        Title
      </label>
      <input
        id="kicker-title"
        className={styles.input}
        value={title}
        maxLength={255}
        disabled={saving}
        onChange={(event) => setSaveFields({ title: event.target.value })}
      />

      <label className={styles.field} htmlFor="kicker-description">
        Description
      </label>
      <textarea
        id="kicker-description"
        className={styles.textarea}
        value={description}
        maxLength={255}
        disabled={saving}
        onChange={(event) => setSaveFields({ description: event.target.value })}
      />

      <div className={styles.buttonRow}>
        <button type="button" disabled={saving} onClick={onSave}>
          {saving ? "Saving\u2026" : "Save"}
        </button>
      </div>
    </div>
  );
}

/** The read-only notes shown once a kicker has been saved or loaded. */
export function NotesPanel() {
  const { title, description } = useEditorStore((state) => state.kicker);

  return (
    <div className="size-2">
      <p className={styles.note}>{title}</p>
      <p className={styles.note}>{description}</p>
    </div>
  );
}
