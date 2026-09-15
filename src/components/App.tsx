"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useLocalIdentity } from "@/hooks/use-offline-shared-link";
import { useOutbox } from "@/hooks/use-outbox";
import { useShareableUrl } from "@/hooks/use-shareable-url";
import { ABOUT_LINK, GITHUB_LINK, SITE_TITLE_HTML, TWITTER_LINK } from "@/lib/site";
import { useEditorStore, type EditorInit } from "@/store/editor-store";
import styles from "./app.module.css";

/** Ported from the .loading-placeholder block in legacy/public/index.php. */
function LoadingPlaceholder() {
  return (
    <div className={styles.loadingPlaceholder}>
      <svg
        className={`${styles.loadAnimation} rotating`}
        width="40"
        height="40"
        viewBox="0 0 50 50"
        role="status"
        aria-label="Loading the editor"
      >
        <path
          d="M25.251,6.461c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615V6.461z"
          transform="rotate(291.879 25 25)"
        />
      </svg>
    </div>
  );
}

/**
 * three.js, drei and the XR runtime are the bulk of the bundle and are of no
 * use to someone reading the pitch, so the editor is fetched on demand. The
 * legacy app did the same thing by injecting script tags from main.js.
 */
const Editor = dynamic(() => import("./editor/Editor").then((module) => module.Editor), {
  ssr: false,
  loading: LoadingPlaceholder,
});

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
export function App({ init, landing }: { init: EditorInit; landing: React.ReactNode }) {
  const editorOpen = useEditorStore((state) => state.editorOpen);
  const vrActive = useEditorStore((state) => state.vrActive);
  const savedId = useEditorStore((state) => state.savedId);
  const initialize = useEditorStore((state) => state.initialize);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const initialized = useRef(false);

  /*
   * The store is a module singleton, so adopting the server's starting state
   * has to wait for the browser: doing it while rendering would mean one
   * request's kicker could bleed into another's on a server handling both at
   * once. The editor is `ssr: false` and shows its spinner until this lands,
   * so nothing renders the default kicker in the meantime.
   */
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    initialize(init);
  }, [init, initialize]);

  useShareableUrl(savedId);

  useLocalIdentity();

  /*
   * Runs for the whole session rather than only while the editor is open, so
   * that designs saved before an outage get sent on the next visit even if the
   * user never opens the editor again.
   */
  useOutbox();

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

      {/*
       * Rendered on the server and handed down, so the landing page's
       * illustrations and their geometry never enter this client bundle. The
       * only thing in there that needs the browser is its own button.
       */}
      <div className={styles.hideInVr}>{landing}</div>

      <main className={styles.main} ref={editorRef}>
        {editorOpen && <Editor />}
      </main>

      <Footer />
    </div>
  );
}
