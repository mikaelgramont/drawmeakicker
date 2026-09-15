/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import {
  Serwist,
  type PrecacheEntry,
  type RouteHandlerCallback,
  type SerwistGlobalConfig,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * The statically rendered shell served whenever the network cannot supply a
 * document. `/` cannot play this role: it reads `headers()` and `searchParams`
 * to resolve `?id=` on the server, so it is a dynamic route and the build
 * emits no HTML for it to precache.
 */
const OFFLINE_URL = "/~offline";

/**
 * How long a document request may take before the shell is served instead.
 * Generous enough for a slow connection, short enough that nobody stares at a
 * blank tab wondering whether the app is broken.
 */
const DOCUMENT_TIMEOUT_MS = 8000;

/** The last thing we can say if even the precache has gone. */
function precacheMissing(): Response {
  return new Response(
    "<!doctype html><title>Offline</title><p>This app is offline and its cache is unavailable. Reconnect and reload.",
    { status: 503, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

/**
 * Serves documents from the network, or the precached shell when the network
 * cannot be trusted to produce one.
 *
 * Three things here are deliberate, and each of them is a way the app could
 * otherwise lock someone out of designs sitting intact in IndexedDB.
 *
 * An HTTP error status counts as a failure. NetworkFirst would not do this: it
 * only consults the cache when the fetch *rejects*, so a 500 from the app or an
 * HTML error page from a proxy is an ordinary response as far as it is
 * concerned, and it hands it to the page.
 *
 * A request that never settles counts as a failure too. NetworkFirst's
 * `networkTimeoutSeconds` cannot cover this, because on timeout it resolves
 * with a cache lookup and then falls back to awaiting the network promise
 * anyway. With no cached copy of `/` that await never returns, and a server
 * that accepts connections without answering hangs the tab indefinitely.
 *
 * And nothing is cached here. A runtime-cached `/` would be HTML from one build
 * referring to content-hashed chunks that only that build's precache holds, so
 * the next deployment would leave it pointing at chunks nobody has. Falling
 * back to a precached document instead keeps the shell and the chunks it asks
 * for in the same generation, always.
 */
const handleDocument: RouteHandlerCallback = async ({ request }) => {
  const fromNetwork = (async () => {
    const response = await fetch(request);
    if (!response.ok) throw new Error(`Upstream answered ${response.status}`);
    return response;
  })();

  // Losing the race leaves this promise pending, so it needs a catch of its own
  // or its eventual rejection surfaces as an unhandled one.
  fromNetwork.catch(() => {});

  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Timed out")), DOCUMENT_TIMEOUT_MS);
  });

  try {
    return await Promise.race([fromNetwork, deadline]);
  } catch {
    return (await serwist.matchPrecache(OFFLINE_URL)) ?? precacheMissing();
  } finally {
    clearTimeout(timer);
  }
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  /*
   * Deliberately not skipWaiting/clientsClaim. The precache manifest is one
   * self-consistent generation of shell plus content-hashed chunks, and a page
   * already running holds the previous generation's chunk URLs in its bundle.
   * Activating a new worker underneath it would leave the editor's lazily
   * imported chunk resolvable only from a server that may well be the reason
   * we are offline in the first place. Waiting for every tab to close keeps
   * each session internally consistent.
   */
  clientsClaim: false,
  skipWaiting: false,
  /*
   * Navigation preload has to stay off. StrategyHandler.fetch returns a
   * preloaded response before it runs any plugin callback, and only ever for
   * `mode === "navigate"`, so enabling it would hand the page a preloaded 500
   * without handleDocument ever seeing it.
   */
  navigationPreload: false,
  runtimeCaching: [
    {
      matcher: ({ request, sameOrigin }) => sameOrigin && request.destination === "document",
      handler: handleDocument,
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
