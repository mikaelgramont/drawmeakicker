"use client";

import { useEffect } from "react";
import { countUnsynced, getDesign } from "@/lib/local/designs";
import { drainOutbox, startOutbox } from "@/lib/local/outbox";
import { hasServer } from "@/lib/runtime";
import { useEditorStore } from "@/store/editor-store";

/**
 * Reads back what the library now says and tells the store.
 *
 * Deliberately re-reads rather than trusting the drain's summary: the drain
 * reports what it did, and what the UI needs is the state of the record, which
 * another tab may also have moved on.
 */
async function reflect(): Promise<void> {
  const { localId } = useEditorStore.getState();
  const [pending, open] = await Promise.all([
    countUnsynced(),
    localId ? getDesign(localId) : Promise.resolve(null),
  ]);

  const store = useEditorStore.getState();
  store.setPendingCount(pending);
  if (open) store.applySyncResult(open);
}

/**
 * Drains the outbox once and updates the UI.
 *
 * Used for the two moments worth an immediate attempt: saving a design, and
 * asking for a retry from the library. Never rejects, because nothing the user
 * did is undone by a sync failing — the design is already on disk.
 */
export async function syncNow(): Promise<void> {
  try {
    await drainOutbox();
  } catch (error) {
    console.error("The outbox could not be drained", error);
  }
  await reflect().catch(() => {});
}

/**
 * Runs the outbox for as long as the app is mounted.
 *
 * A no-op when the shell has no server behind it (the desktop app): the whole
 * outbox exists to push saves at a server, and without one there is nowhere
 * for the drain to push to. `syncNow` and `drainOutbox` stay exported for the
 * web, and for the tests that exercise them.
 */
export function useOutbox(): void {
  useEffect(() => {
    if (!hasServer()) return;
    const stop = startOutbox(() => void reflect());
    return stop;
  }, []);
}
