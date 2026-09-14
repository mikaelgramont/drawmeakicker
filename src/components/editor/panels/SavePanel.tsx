"use client";

import { GENERIC_SAVE_ERROR, saveKicker } from "@/lib/kicker-api";
import { useEditorStore } from "@/store/editor-store";
import styles from "./panels.module.css";

/**
 * Title and description for a kicker, ported from bihi-save.
 *
 * Pressing Save posts to /api/kickers and, on success, hands the new id and
 * share links to the store, which swaps this step for Share. Failures go to
 * the alert banner, as the legacy alert-set-message event did.
 */
export function SavePanel() {
  const { title, description } = useEditorStore((state) => state.kicker);
  const setSaveFields = useEditorStore((state) => state.setSaveFields);
  const saving = useEditorStore((state) => state.saving);
  const setSaving = useEditorStore((state) => state.setSaving);
  const markSaved = useEditorStore((state) => state.markSaved);
  const setAlert = useEditorStore((state) => state.setAlert);

  async function onSave() {
    setSaving(true);
    try {
      // Read the kicker here rather than subscribing to it: this panel would
      // otherwise re-render on every drag of a parameter slider.
      markSaved(await saveKicker(useEditorStore.getState().kicker));
    } catch (error) {
      setSaving(false);
      setAlert(error instanceof Error ? error.message : GENERIC_SAVE_ERROR);
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
