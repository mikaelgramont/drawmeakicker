"use client";

import { useEditorStore } from "@/store/editor-store";
import styles from "./panels.module.css";

/**
 * The share buttons, ported from bihi-share.
 *
 * The URLs are built by the server, either when a `?id=` page is rendered or
 * in the save response, so this only has to open them. The legacy element
 * held on to the popup to focus it on a second click; that needs a same-origin
 * handle, which `noopener` deliberately withholds, and the reference is not
 * worth handing a third-party page the ability to navigate this one.
 */
export function SharePanel() {
  const share = useEditorStore((state) => state.share);

  if (!share) return null;

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

function openShare(url: string) {
  window.open(url, "_blank", "noopener");
}
