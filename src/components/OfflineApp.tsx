"use client";

import { useMemo } from "react";
import { App } from "@/components/App";
import styles from "@/components/landing/landing.module.css";
import { StartButton } from "@/components/landing/StartButton";
import { useOfflineSharedLink } from "@/hooks/use-offline-shared-link";
import { unitsForLanguage } from "@/lib/kicker";
import type { EditorInit } from "@/store/editor-store";

/**
 * The editor without a server to set it up.
 *
 * `/` resolves `?id=` and the starting unit on the server, which is what gives
 * a shared link its `og:` tags. None of that is available here, so the two
 * pieces that actually matter to someone using the app get derived from the
 * browser instead: `unitsForLanguage` reads `navigator.languages` rather than
 * the `Accept-Language` header it was written for, which carries the same
 * preference in the same order, and `?id=` is looked up in the local library.
 */
export function OfflineApp() {
  useOfflineSharedLink();

  const init = useMemo<EditorInit>(() => {
    // This component is also rendered at build time to produce the HTML the
    // service worker precaches, where there is no navigator. The value that
    // reaches the store is always the one computed during hydration, because
    // App only calls initialize from an effect.
    const languages = typeof navigator === "undefined" ? "" : navigator.languages.join(",");
    return { units: unitsForLanguage(languages) };
  }, []);

  /*
   * The shell gets a short intro instead of the landing page. The full one is
   * a server component (src/components/landing), which this cannot render, and
   * importing it here would drag its geometry into the client bundle to show a
   * sales pitch to someone who is already a user — the person looking at this
   * screen came back for the designs they saved, so that is what it points at.
   */
  return (
    <App
      init={init}
      landing={
        <div className={styles.landing}>
          <h2 className={styles.heroTitle}>
            Ramp design <span>the easy way.</span>
          </h2>
          <p className={styles.heroLead}>
            We could not reach the server, so this is the short version. Everything you have
            saved on this device is still here.
          </p>
          <div className={styles.heroActions}>
            <StartButton>Open the editor</StartButton>
          </div>
        </div>
      }
    />
  );
}
