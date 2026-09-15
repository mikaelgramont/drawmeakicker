/**
 * Teaches the shared editor how to do the two things it cannot do inside a
 * WebView that has no origin and no browser chrome. See src/lib/runtime.ts for
 * why each is a seam rather than a branch inside the code that needs it.
 */
import { invoke } from "@tauri-apps/api/core";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { configureRuntime } from "@/lib/runtime";

/**
 * The site the desktop app syncs to.
 *
 * Saving is local and immediate either way — designs go to IndexedDB and the
 * outbox pushes them afterwards — so this only decides where a design goes to
 * be given the server id that a share link is built from. Override it with
 * VITE_API_ORIGIN at build time, or set it empty to keep the app entirely to
 * itself, in which case saves stay pending and the share step says so.
 *
 * Changing it means changing the matching `http:default` scope in
 * src-tauri/capabilities/default.json too. The allowance is enforced in Rust,
 * which cannot see this value, so a new origin here without one there is a
 * request that gets refused rather than sent.
 */
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? "https://drawmeakicker.com";

export function installDesktopRuntime(): void {
  configureRuntime({
    apiOrigin: API_ORIGIN,

    /*
     * Rust's HTTP client, not the WebView's. The request therefore has no
     * origin to be checked, which is what makes talking to the API possible at
     * all without adding CORS headers to an endpoint that has no other reason
     * to want them.
     */
    fetch: (input, init) => tauriFetch(input, init),

    /*
     * A real save dialog, because WKWebView ignores the `download` attribute
     * and the export would otherwise appear to do nothing whatsoever.
     *
     * Asynchronous where the browser's is not, and the seam returns void, so a
     * dismissed dialog and a failed write both come to nothing. Neither is
     * worth interrupting someone who is still drawing, but a failure is worth
     * having in the log, and an uncaught rejection here would be neither.
     */
    saveDataUrl: (dataUrl, filename) => {
      void invoke("save_export", {
        filename,
        base64: dataUrl.slice(dataUrl.indexOf(",") + 1),
      }).catch((error: unknown) => {
        console.error("Could not save the export", error);
      });
    },
  });
}
