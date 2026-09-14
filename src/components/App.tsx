"use client";

import { useEffect, useRef } from "react";
import { ABOUT_LINK, GITHUB_LINK, SITE_TITLE_HTML, TWITTER_LINK, VIDEO_ID } from "@/lib/site";
import { useEditorStore } from "@/store/editor-store";
import { Editor } from "./editor/Editor";
import styles from "./app.module.css";

function Alert() {
  const alert = useEditorStore((state) => state.alert);
  const setAlert = useEditorStore((state) => state.setAlert);
  if (!alert) return null;

  return (
    <div className={styles.alert} role="alert">
      <span>{alert}</span>
      <button
        type="button"
        className={styles.alertClose}
        aria-label="Close this message."
        onClick={() => setAlert("")}
      >
        X
      </button>
    </div>
  );
}

function TopSection({ onStart, started }: { onStart: () => void; started: boolean }) {
  return (
    <div className={`${styles.topSectionContainer} ${styles.hideInVr}`}>
      <section className={styles.topSection}>
        <h2 className={styles.topSectionHeader}>
          <span>Ramp design</span> <span>the easy way.</span>
        </h2>
        <div className={styles.topSectionBody}>
          <div className={`${styles.intro} ${styles.topSectionContent} size-2`}>
            <p>
              If you&rsquo;re thinking of building a kicker and you have some idea of what you
              want, but are not sure about the exact dimensions, we can help.
            </p>
            <p>
              The nerds here have done the math for you, so you can focus on the fun part:
              deciding how big you want to go!
            </p>
            <button type="button" className="action" disabled={started} onClick={onStart}>
              Get Started
            </button>
          </div>
          {VIDEO_ID && (
            <div className={`${styles.videoContainer} ${styles.topSectionContent}`}>
              <div className={styles.videoAspectRatio}>
                <iframe
                  src={`https://www.youtube.com/embed/${VIDEO_ID}`}
                  title="Draw me a kicker"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Footer() {
  const links = [
    { href: ABOUT_LINK, label: "About" },
    { href: TWITTER_LINK, label: "Twitter" },
    { href: GITHUB_LINK, label: "GitHub" },
  ].filter((link) => link.href);

  if (links.length === 0) return null;

  return (
    <footer className={`${styles.footer} ${styles.hideInVr}`}>
      <ul>
        {links.map(({ href, label }) => (
          <li key={label}>
            <a href={href}>{label}</a>
          </li>
        ))}
      </ul>
    </footer>
  );
}

/**
 * The page: pitch above, editor below.
 *
 * Ported from the markup in legacy/public/index.php. The editor mounts only
 * once the user asks for it, which is what the legacy `expanded-editor` body
 * class and the deferred `editorEl.init()` call amounted to, except that here
 * it also defers creating the WebGL context.
 */
export function App() {
  const editorOpen = useEditorStore((state) => state.editorOpen);
  const openEditor = useEditorStore((state) => state.openEditor);
  const vrActive = useEditorStore((state) => state.vrActive);
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (editorOpen) editorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [editorOpen]);

  return (
    <div
      className={`${styles.shell} ${editorOpen ? styles.expanded : ""} ${
        vrActive ? styles.inVr : ""
      }`}
    >
      <Alert />

      <header className={`${styles.header} ${styles.hideInVr}`}>
        <div role="banner" className={`${styles.logo} size-4`}>
          {SITE_TITLE_HTML}
        </div>
      </header>

      <TopSection onStart={openEditor} started={editorOpen} />

      <main className={styles.main} ref={editorRef}>
        {editorOpen && <Editor />}
      </main>

      <Footer />
    </div>
  );
}
