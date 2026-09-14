"use client";

import { formatLength } from "@/lib/kicker";
import { useEditorStore, useResults } from "@/store/editor-store";
import styles from "./panels.module.css";

/** The computed dimensions. Ported from bihi-results. */
export function ResultsPanel() {
  const units = useEditorStore((state) => state.units);
  const { radius, length, arc } = useResults();

  const results = [
    { caption: "Radius", value: radius },
    { caption: "Base length", value: length },
    { caption: "Surface length", value: arc },
  ];

  return (
    <>
      {results.map(({ caption, value }) => (
        <p key={caption} className={`${styles.result} size-2`}>
          <span>{caption}</span>: <span>{formatLength(value, units)}</span>
        </p>
      ))}
    </>
  );
}
