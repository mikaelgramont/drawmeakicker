"use client";

import { useEffect, useState } from "react";

/**
 * Whether the browser currently believes it has a network.
 *
 * Only ever used to word things. `navigator.onLine` reports that a link exists,
 * not that the server behind it is answering — it is true on a captive portal
 * and on a connection whose upstream is returning 500s — so it must not decide
 * whether a sync is attempted. The outbox finds that out by trying.
 */
export function useOnline(): boolean {
  // Starts optimistic so the markup matches what the server rendered, then
  // corrects itself on mount.
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();

    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return online;
}
