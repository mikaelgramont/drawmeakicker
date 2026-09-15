"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { syncNow } from "@/hooks/use-outbox";
import { formatLength } from "@/lib/kicker";
import {
  deleteDesign,
  listDesigns,
  retryDesign,
  type LocalDesign,
  type SyncState,
} from "@/lib/local/designs";
import { exportLibrary, importLibrary, NOT_A_LIBRARY } from "@/lib/local/transfer";
import { useEditorStore } from "@/store/editor-store";
import styles from "./panels.module.css";

/** What each sync state means, in terms of what the user can do about it. */
const SYNC_LABELS: Record<SyncState, string> = {
  pending: "waiting for the server",
  syncing: "sending",
  synced: "shareable",
  failed: "not accepted by the server",
};

function downloadText(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Every design saved on this device.
 *
 * The counterpart to saving without a server: designs that never reached one
 * would otherwise be invisible and unreachable, which would make "saved" a lie.
 * Reads straight from the library, so it works during an outage exactly as it
 * does the rest of the time.
 */
export function LibraryPanel() {
  const [designs, setDesigns] = useState<LocalDesign[]>([]);
  const [unreadable, setUnreadable] = useState(0);
  const [message, setMessage] = useState("");
  const openDesign = useEditorStore((state) => state.openDesign);
  const localId = useEditorStore((state) => state.localId);
  const units = useEditorStore((state) => state.units);
  // Changes whenever the outbox has been round, which is the cue to re-read.
  const pendingCount = useEditorStore((state) => state.pendingCount);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await listDesigns();
      setDesigns(list.designs);
      setUnreadable(list.unreadable);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The library could not be read.");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, pendingCount]);

  async function onDelete(design: LocalDesign) {
    await deleteDesign(design.localId);
    await refresh();
  }

  async function onRetry(design: LocalDesign) {
    await retryDesign(design.localId);
    await syncNow();
    await refresh();
  }

  async function onExport() {
    downloadText(await exportLibrary(), "drawmeakicker-library.json");
  }

  async function onImport(file: File) {
    try {
      const summary = await importLibrary(await file.text());
      setMessage(
        `Imported ${summary.imported}, skipped ${summary.skipped} already here` +
          (summary.unreadable > 0 ? `, could not read ${summary.unreadable}` : "") +
          ".",
      );
      await refresh();
      void syncNow();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : NOT_A_LIBRARY);
    }
  }

  return (
    <div className="size-2">
      {designs.length === 0 ? (
        <p className={styles.note}>Nothing saved on this device yet.</p>
      ) : (
        <ul className={styles.library}>
          {designs.map((design) => {
            return (
              <li key={design.localId} className={styles.libraryRow}>
                <div className={styles.libraryMain}>
                  <button
                    type="button"
                    className={styles.libraryOpen}
                    disabled={design.localId === localId}
                    onClick={() => openDesign(design)}
                  >
                    {design.kicker.title || "Untitled"}
                  </button>
                  <span className={styles.librarySub}>
                    {formatLength(design.kicker.height, units)} at{" "}
                    {design.kicker.angle.toFixed(0)}
                    {"\u00b0"} &middot; {SYNC_LABELS[design.syncState]}
                  </span>
                </div>
                <div className={styles.libraryActions}>
                  {design.syncState !== "synced" && (
                    <button
                      type="button"
                      className="small"
                      onClick={() => void onRetry(design)}
                    >
                      Retry
                    </button>
                  )}{" "}
                  <button
                    type="button"
                    className="small deemphasized"
                    aria-label={`Delete ${design.kicker.title || "this design"}`}
                    onClick={() => void onDelete(design)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/*
        Shown rather than swallowed. A record this version cannot read is the
        one case where the user genuinely has something we are not displaying,
        and an export is how they get it looked at.
      */}
      {unreadable > 0 && (
        <p className={styles.note}>
          {unreadable === 1 ? "1 saved design" : `${unreadable} saved designs`} could not be
          read by this version of the app. Exporting keeps a copy.
        </p>
      )}

      {message && <p className={styles.note}>{message}</p>}

      <div className={styles.buttonRow}>
        <button type="button" className="small" onClick={() => void onExport()}>
          Export
        </button>{" "}
        <button type="button" className="small" onClick={() => fileInput.current?.click()}>
          Import
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            // Cleared so choosing the same file twice fires change again.
            event.target.value = "";
            if (file) void onImport(file);
          }}
        />
      </div>
    </div>
  );
}
