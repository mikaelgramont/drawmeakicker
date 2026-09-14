"use client";

import { useEditorStore } from "@/store/editor-store";
import styles from "./panels.module.css";

/**
 * Title and description for a kicker, ported from bihi-save.
 *
 * The Save button is inert in Phase 1: there is no backend to post to yet, and
 * the app is built as a static export. Phase 2 wires it to POST /api/kickers.
 */
export function SavePanel() {
  const { title, description } = useEditorStore((state) => state.kicker);
  const setSaveFields = useEditorStore((state) => state.setSaveFields);

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
        onChange={(event) => setSaveFields({ description: event.target.value })}
      />

      <div className={styles.buttonRow}>
        <button type="button" disabled title="Saving arrives with the database in Phase 2">
          Save
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
