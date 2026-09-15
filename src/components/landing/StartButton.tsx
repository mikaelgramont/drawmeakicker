"use client";

import { useEditorStore } from "@/store/editor-store";

/**
 * The only interactive thing on the landing page.
 *
 * It exists so the rest of the page can stay a server component: the
 * illustrations are a few hundred lines of geometry, and none of it needs to
 * reach the browser to be looked at.
 */
export function StartButton({ children = "Get Started" }: { children?: React.ReactNode }) {
  const openEditor = useEditorStore((state) => state.openEditor);
  const editorOpen = useEditorStore((state) => state.editorOpen);

  return (
    <button type="button" className="action" disabled={editorOpen} onClick={openEditor}>
      {children}
    </button>
  );
}
