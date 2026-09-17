/**
 * The desktop app's root.
 *
 * Deliberately thin. `App` is the same component the website renders, and
 * everything below it — the editor, the scene, the store, the local library —
 * is imported from src/ unchanged; the only things that differ between a tab
 * and a window are the two arguments `App` already takes, so those are all
 * this supplies.
 *
 * It parallels src/components/OfflineApp.tsx rather than reusing it, because
 * the one thing that file hard-codes is the reason it is on screen: it
 * apologises for an unreachable server. Here there is no server involved in
 * start-up at all, and nothing has gone wrong.
 */
import { useMemo } from "react";
import { App } from "@/components/App";
import styles from "@/components/landing/landing.module.css";
import { StartButton } from "@/components/landing/StartButton";
import { preferredUnits } from "@/lib/units-preference";
import type { EditorInit } from "@/store/editor-store";

export function DesktopApp() {
  /*
   * The website resolves the starting unit from the Accept-Language header at
   * render time; the equivalent inside the WebView is `navigator.languages`,
   * which carries the same preference in the same order.
   */
  const init = useMemo<EditorInit>(() => ({ units: preferredUnits() }), []);

  /*
   * The website's landing page is a server component whose illustrations are a
   * few hundred lines of geometry, so it cannot be rendered here and is not
   * worth pulling into this bundle to pitch the app to someone who has already
   * installed it. They opened it to draw something, and the editor is one
   * click away — or already open, if they were in the middle of a design.
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
            Draw a kicker, get the cut list. Everything you save stays on this computer.
          </p>
          <div className={styles.heroActions}>
            <StartButton>Open the editor</StartButton>
          </div>
        </div>
      }
    />
  );
}
