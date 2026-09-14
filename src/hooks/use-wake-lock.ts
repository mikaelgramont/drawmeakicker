"use client";

import { useEffect } from "react";

/**
 * Keeps the screen awake while active.
 *
 * legacy/public/scripts/wakelock.js did this by looping a tiny hidden video,
 * which was the only trick available at the time. The Screen Wake Lock API
 * does it properly; where it is missing we simply let the screen dim.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;

    let sentinel: WakeLockSentinel | undefined;
    let released = false;

    navigator.wakeLock
      .request("screen")
      .then((lock) => {
        if (released) {
          void lock.release();
          return;
        }
        sentinel = lock;
      })
      .catch(() => {
        // Denied or unsupported; nothing to recover from.
      });

    return () => {
      released = true;
      void sentinel?.release();
    };
  }, [active]);
}
