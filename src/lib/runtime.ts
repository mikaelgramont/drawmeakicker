/**
 * The handful of things the editor needs from whatever is hosting it.
 *
 * In a browser tab every answer is implied, and this module is a description of
 * what already happens: the API is a path on the origin the page came from,
 * `fetch` is the one the page has, and saving a file means handing the user a
 * download. None of the three survives the move to the desktop build, where the
 * document is served from `tauri://localhost`:
 *
 *  - a relative API path resolves into the app bundle, and an absolute one is a
 *    cross-origin request that the endpoint sends no CORS headers for,
 *  - so the request has to be made from Rust instead, by a `fetch` that is not
 *    the WebView's and is not bound by its origin,
 *  - and `<a download>` is ignored outright by WKWebView, so an export needs a
 *    real save dialog.
 *
 * All three are the shell's business rather than the editor's, which is why
 * they are answered once at start-up and read back from here. Anything that
 * never calls `configureRuntime` cannot tell this module exists.
 */

/**
 * Narrower than `typeof fetch` deliberately: this is the shape a replacement
 * has to provide, and Tauri's HTTP client takes a URL rather than a `Request`.
 */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type SaveDataUrl = (dataUrl: string, filename: string) => void;

interface Runtime {
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
