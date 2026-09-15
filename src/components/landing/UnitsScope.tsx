"use client";

import { useEffect, useState } from "react";
import type { Unit } from "@/lib/kicker";
import { useEditorStore } from "@/store/editor-store";

/**
 * Publishes the chosen unit to the server-rendered landing page inside it, as
 * the `data-units` attribute BothUnits keys its visibility off.
 *
 * This is the whole client-side cost of keeping that page in step with the
 * toggle: one attribute, no illustrations re-rendered and no geometry shipped.
 *
 * It starts at the server's guess and only moves when the store does, which is
 * deliberate. Reading the store on mount instead would briefly show its module
 * default: effects run from the inside out, so this one fires before the App
 * above it has had the chance to settle the starting state, and a visitor whose
 * language asked for feet would watch the page blink through meters.
 */
export function UnitsScope({
  initial,
  children,
}: {
  initial: Unit;
  children: React.ReactNode;
}) {
  const [units, setUnits] = useState(initial);

  useEffect(() => useEditorStore.subscribe((state) => setUnits(state.units)), []);

  return <div data-units={units}>{children}</div>;
}
