/**
 * The handful of things the editor needs from whatever is hosting it.
 *
 * In a browser tab every answer is implied, and this module is a description
 * of what already happens on the web: there is a server behind the app's own
 * origin, `fetch` reaches it, and saving a file means handing the user a
 * download. None of the three carries over to the desktop build. The document
 * is served from `tauri://localhost`, which is cross-origin to the website's
 * server; `<a download>` is ignored outright by WKWebView, so an export needs
 * a real save dialog; and the desktop app has no server at all — everything
 * that saves lives on this device and never leaves it.
 *
 * All four answers are the shell's business rather than the editor's, which
 * is why they are answered once at start-up and read back from here. Anything
 * that never calls `configureRuntime` cannot tell this module exists.
 */

/**
 * Narrower than `typeof fetch` deliberately: this is the shape a replacement
 * has to provide, and Tauri's HTTP client takes a URL rather than a `Request`.
 */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type SaveDataUrl = (dataUrl: string, filename: string) => void;

interface Runtime {
  /**
   * Whether this shell has a server to talk to at all.
   *
   * The web build has one — it is the same origin the page came from — and
   * every server-dependent feature (the outbox, the share links, the `?id=`
   * rewriter, the sync status chip) is gated on this. The desktop build sets
   * it to `false`, and those features never mount. The value is read
   * synchronously, so it must be set before anything renders.
   */
  hasServer: boolean;
  /** Prefixed onto API paths. Empty means same-origin, as on the web. */
  apiOrigin: string;
  fetch: FetchLike;
  saveDataUrl: SaveDataUrl;
}

/** The browser's answer: offer it as a download and let the chrome take over. */
const anchorDownload: SaveDataUrl = (dataUrl, filename) => {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
};

const current: Runtime = {
  hasServer: true,
  apiOrigin: "",
  /*
   * Delegates rather than aliasing `globalThis.fetch`, so the call is resolved
   * when it is made. Capturing the reference here would freeze whichever
   * `fetch` existed at import time, which is the one thing a test replacing it
   * with `vi.stubGlobal` needs not to happen.
   */
  fetch: (input, init) => fetch(input, init),
  saveDataUrl: anchorDownload,
};

/** Called once by a shell that is not a browser tab, before anything renders. */
export function configureRuntime(overrides: Partial<Runtime>): void {
  Object.assign(current, overrides);
}

/**
 * Whether the editor should mount the features that only make sense with a
 * server behind it: the outbox, the share links, and everything that follows
 * from them. Set once at start-up, so the answer does not change during a
 * session.
 */
export function hasServer(): boolean {
  return current.hasServer;
}

/** Resolves an API path against the configured origin. */
export function apiUrl(path: string): string {
  return current.apiOrigin ? `${current.apiOrigin.replace(/\/+$/, "")}${path}` : path;
}

/** `fetch`, aimed at the configured server and made by the configured client. */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return current.fetch(apiUrl(path), init);
}

/** Puts a generated file wherever this shell puts files. */
export function saveDataUrl(dataUrl: string, filename: string): void {
  current.saveDataUrl(dataUrl, filename);
}
