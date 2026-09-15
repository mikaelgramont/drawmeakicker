/**
 * Sends outbound links to the user's browser instead of into the app window.
 *
 * A WebView is the whole app here, not a tab, so it has no back button and no
 * address bar: letting Twitter's share dialog load into it would replace the
 * editor with a page the user cannot leave, taking an unsaved design with it.
 *
 * Done here, in the shell, because the components doing the linking are shared
 * with the web build, where following a link in place is exactly right. There
 * are two ways out to intercept — the share buttons call `window.open`, the
 * footer is plain anchors — and no third, since the app never sets `target` or
 * navigates to an external URL itself.
 */
import { openUrl } from "@tauri-apps/plugin-opener";

/** Only http(s) leaves. `tauri://` and in-page `#` links are ours. */
function isExternal(href: string): boolean {
  try {
    return /^https?:$/.test(new URL(href, window.location.href).protocol);
  } catch {
    return false;
  }
}

function handOff(href: string): void {
  void openUrl(href).catch((error: unknown) => {
    console.error(`Could not open ${href}`, error);
  });
}

export function interceptExternalLinks(): void {
  /*
   * Capture phase, so this runs before anything that might stop propagation,
   * but still after a modifier-click or a handler that has already called
   * preventDefault — those are the user asking for something other than a
   * plain navigation, and none of them should turn into an external open.
   */
  document.addEventListener(
    "click",
    (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || !isExternal(anchor.href)) return;

      event.preventDefault();
      handOff(anchor.href);
    },
    true,
  );

  /*
   * Returning null is honest: `noopener` already means the caller was given
   * nothing to hold, and every call site in the app discards the result.
   */
  window.open = (url?: string | URL) => {
    const href = url?.toString();
    if (href && isExternal(href)) handOff(href);
    return null;
  };
}
