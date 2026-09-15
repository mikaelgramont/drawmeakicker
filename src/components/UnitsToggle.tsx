"use client";

import { UNITS, type Unit } from "@/lib/kicker";
import { useEditorStore } from "@/store/editor-store";
import styles from "./app.module.css";

const LABELS: Record<Unit, { long: string; short: string }> = {
  m: { long: "Meters", short: "m" },
  ft: { long: "Feet", short: "ft" },
};

/**
 * The unit switch in the masthead.
 *
 * Reads and writes the same `units` field in the store as the editor's own
 * picker, so the two are the same control in two places rather than two
 * settings to keep aligned. The store writes the choice through to local
 * storage, which is what makes it outlive the visit.
 *
 * This one is in the masthead because the unit matters before the editor
 * exists: every measurement on the landing page is in it too.
 *
 * The radio group is named apart from the editor's. Radios in one document
 * sharing a name are one group, so leaving both as `units` would put four
 * buttons in a single group and break arrow-key navigation through either.
 */
export function UnitsToggle() {
  const units = useEditorStore((state) => state.units);
  const setUnits = useEditorStore((state) => state.setUnits);

  return (
    <fieldset className={styles.unitsToggle}>
      <legend className={styles.unitsLegend}>Units</legend>
      {UNITS.map((unit) => (
        <label key={unit} className={styles.unitsChoice}>
          <input
            type="radio"
            name="masthead-units"
            checked={units === unit}
            onChange={() => setUnits(unit)}
          />
          <span aria-hidden className={styles.unitsShort}>
            {LABELS[unit].short}
          </span>
          {/* The abbreviation is what is drawn; the word is what is announced. */}
          <span className={styles.unitsLong}>{LABELS[unit].long}</span>
        </label>
      ))}
    </fieldset>
  );
}
