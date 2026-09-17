"use client";

import { useEffect } from "react";
import { parseKickerId } from "@/lib/kicker-id";
import { getDesignByServerId } from "@/lib/local/designs";
import { hasServer } from "@/lib/runtime";
import { useEditorStore } from "@/store/editor-store";

/**
 * Someone else's link, or one of ours from before this device had it.
 *
 * The server is the only thing that can turn an id into a design it has never
 * been told about, so there is nothing to show and nothing to retry.
 */
const NOT_HERE =
  "That kicker is not saved on this device and the server cannot be reached right now. " +
  "Here is a fresh one to start from.";

/** Reads the `?id=` the page was opened with, if any. */
function requestedId(): number | null {
  return parseKickerId(new URLSearchParams(window.location.search).get("id") ?? undefined);
}

/**
 * Connects a server-resolved `?id=` link to the matching local record.
 *
 * The server answers a shared link with an id and share links but no notion of
 * which local design that is, so without this the library would not show it as
 * the one on screen and a sync finishing for it would be thrown away as
 * belonging to something else.
 *
 * Deliberately separate from the offline lookup below, which must not run here:
 * a server that answers "no such kicker" is not the same as a server that could
 * not be asked, and only the second is worth telling the user to try later.
 *
 * A no-op when the shell has no server behind it (the desktop app): there is
 * no shared link for it to have resolved, and `savedId` never leaves `null`.
 */
export function useLocalIdentity(): void {
  useEffect(() => {
    if (!hasServer()) return;
    const id = requestedId();
    if (id === null) return;

    /*
     * A `savedId` means the server resolved the link, which is the only case
     * this hook is for. Without one we are on the offline shell, where the
     * lookup below does the whole job; App's initialize effect is declared
     * first, so the answer is already in the store by now.
     */
    if (useEditorStore.getState().savedId === null) return;

    let cancelled = false;

    void (async () => {
      const design = await getDesignByServerId(id).catch(() => null);
      const store = useEditorStore.getState();
      // Nothing to connect, or something already did.
      if (cancelled || !design || store.localId !== null) return;
      store.adoptLocalIdentity(design);
    })();

    return () => {
      cancelled = true;
    };
  }, []);
}

/**
 * Resolves a `?id=` link out of the local library.
 *
 * Only ever runs from the offline shell. `/` resolves `?id=` on the server,
 * which is what gives a shared link its `og:` tags; this is the fallback for
 * when that server could not answer, and it is why a link to your own design
 * still opens during an outage instead of showing a blank editor.
 *
 * Runs as an effect rather than feeding the initial state so the precached HTML
 * stays the complete page. App's own initialize effect runs first, being a
 * child, so this only ever refines a store that has already been set up.
 */
export function useOfflineSharedLink(): void {
  useEffect(() => {
    const id = requestedId();
    if (id === null) return;

    let cancelled = false;

    void (async () => {
      const design = await getDesignByServerId(id).catch(() => null);
      if (cancelled) return;

      const store = useEditorStore.getState();
      if (!design) {
        store.setAlert(NOT_HERE);
        return;
      }

      store.openDesign(design);
      // A link should land on the design, not on the pitch above it.
      store.openEditor();
    })();

    return () => {
      cancelled = true;
    };
  }, []);
}
