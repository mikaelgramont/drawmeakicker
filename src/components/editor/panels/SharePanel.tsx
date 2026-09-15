"use client";

import { syncNow } from "@/hooks/use-outbox";
import { useEditorStore } from "@/store/editor-store";
import styles from "./panels.module.css";

/**
 * The share buttons, ported from bihi-share.
 *
 * The URLs are built by the server, either when a `?id=` page is rendered or
 * when a sync comes back, so this only has to open them. The legacy element
 * held on to the popup to focus it on a second click; that needs a same-origin
 * handle, which `noopener` deliberately withholds, and the reference is not
 * worth handing a third-party page the ability to navigate this one.
 *
 * Reaching this step no longer implies there is anything to share. A design is
 * saved as soon as it is on disk, and only the server can mint the id a link
 * points at, so the wait is shown here instead of being the reason the save
 * appeared to fail.
 */
export function SharePanel() {
  const share = useEditorStore((state) => state.share);
  const syncState = useEditorStore((state) => state.syncState);
  const error = useEditorStore((state) => state.alert);

  if (share) {
    return (
      <div className={styles.buttonRow}>
        <button type="button" className="small" onClick={() => openShare(share.twitterUrl)}>
          Twitter
        </button>{" "}
        <button type="button" className="small" onClick={() => openShare(share.facebookUrl)}>
          Facebook
        </button>
      </div>
    );
  }

  // Never saved, so there is nothing to say about sharing it yet.
  if (!syncState) return null;

  return (
    <div className="size-2">
      <p className={styles.note}>
        {syncState === "failed"
          ? "This design is saved on this device, but the server would not accept it, so there is no link to share yet."
          : "This design is saved on this device. A link to share it will appear once the server can be reached."}
      </p>
      {syncState === "failed" && error && <p className={styles.note}>{error}</p>}
      <div className={styles.buttonRow}>
        <button type="button" className="small" onClick={() => void syncNow()}>
          Try again
        </button>
      </div>
    </div>
  );
}

function openShare(url: string) {
  window.open(url, "_blank", "noopener");
}
