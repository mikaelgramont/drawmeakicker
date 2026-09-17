/**
 * Teaches the shared editor two things about running inside a WebView that has
 * no browser chrome and no server behind it. See src/lib/runtime.ts for why
 * each is a seam rather than a branch inside the code that needs it.
 *
 * The one difference between this and its previous incarnation: the desktop
 * app used to POST every save to drawmeakicker.com so it could be given a
 * share link. It does not any more. Everything a design ends up being is what
 * this device has of it, which is what `hasServer: false` tells the editor to
 * mount and skip accordingly.
 */
import { invoke } from "@tauri-apps/api/core";
import { configureRuntime } from "@/lib/runtime";

export function installDesktopRuntime(): void {
  configureRuntime({
    hasServer: false,

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
