"use client";

import { useEffect, useRef } from "react";
import { hasServer } from "@/lib/runtime";

/**
 * Keeps `?id=` in the address bar pointing at the kicker on screen: it appears
 * when a design is saved and disappears when the user starts a derivative.
 *
 * Replaces the two history.replaceState calls in bihi-editor.html, one of
 * which appended to `window.location.href` unconditionally and so produced
 * `?id=1?id=2` when saving twice. Using replaceState rather than the router
 * matters: navigating would re-run the server component and remount the
 * canvas, throwing away the WebGL context and the scene with it.
 *
 * A no-op when the shell has no server behind it (the desktop app): there is
 * no `?id=` to write into a URL bar the app has anyway, and `savedId` never
 * leaves `null` in that case.
 */
export function useShareableUrl(savedId: number | null): void {
  // The server already rendered the correct URL, so the first run has nothing
  // to do. Acting on it would strip a `?id=` that is still being loaded into
  // the store, because this effect's first pass sees the pre-initialize value.
  const mounted = useRef(false);

  useEffect(() => {
    if (!hasServer()) return;
    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    const url = new URL(window.location.href);
    if (savedId === null) {
      url.searchParams.delete("id");
    } else {
      url.searchParams.set("id", String(savedId));
    }

    if (url.href !== window.location.href) {
      window.history.replaceState(null, "", url);
    }
  }, [savedId]);
}
