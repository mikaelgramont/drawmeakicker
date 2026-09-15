"use client";

import { useMemo } from "react";
import { App } from "@/components/App";
import { useOfflineSharedLink } from "@/hooks/use-offline-shared-link";
import { unitsForLanguage } from "@/lib/kicker";
import type { EditorInit } from "@/store/editor-store";

/**
 * The editor without a server to set it up.
 *
 * `/` resolves `?id=` and the starting unit on the server, which is what gives
 * a shared link its `og:` tags. None of that is available here, so the two
 * pieces that actually matter to someone using the app get derived from the
 * browser instead: `unitsForLanguage` reads `navigator.languages` rather than
 * the `Accept-Language` header it was written for, which carries the same
 * preference in the same order, and `?id=` is looked up in the local library.
 */
export function OfflineApp() {
  useOfflineSharedLink();

  const init = useMemo<EditorInit>(() => {
    // This component is also rendered at build time to produce the HTML the
    // service worker precaches, where there is no navigator. The value that
    // reaches the store is always the one computed during hydration, because
    // App only calls initialize from an effect.
    const languages = typeof navigator === "undefined" ? "" : navigator.languages.join(",");
    return { units: unitsForLanguage(languages) };
  }, []);

  return <App init={init} />;
}
