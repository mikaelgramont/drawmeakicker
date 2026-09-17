"use client";

import { useOnline } from "@/hooks/use-online";
import { UNITS, type Unit } from "@/lib/kicker";
import { hasServer } from "@/lib/runtime";
import { useEditorStore } from "@/store/editor-store";
import { useVrSupported, xrStore } from "@/scene/xr";
import styles from "./toolbar.module.css";

const UNIT_LABELS: Record<Unit, { long: string; short: string }> = {
  m: { long: "meters", short: "m" },
  ft: { long: "feet", short: "ft" },
};

/**
 * Ported from bihi-units.
 *
 * The same store field as the masthead's toggle, so changing either moves
 * both. The group is named apart from that one because radios sharing a name
 * in one document are a single group, and all four in one group would break
 * arrow-key navigation through either pair.
 */
function UnitPicker() {
  const units = useEditorStore((state) => state.units);
  const setUnits = useEditorStore((state) => state.setUnits);

  return (
    <div className={`${styles.item} ${styles.first}`}>
      <span className="not-mobile">Units: </span>
      {UNITS.map((unit) => (
        <label key={unit} className={styles.choice}>
          <input
            type="radio"
            name="toolbar-units"
            checked={units === unit}
            onChange={() => setUnits(unit)}
          />
          <span className="not-mobile">{UNIT_LABELS[unit].long}</span>
          <span className="mobile-only">{UNIT_LABELS[unit].short}</span>
        </label>
      ))}
    </div>
  );
}

/** Ported from bihi-representation, minus the hand-rolled fullscreen plumbing. */
function RepresentationPicker() {
  const { repType, textured } = useEditorStore((state) => state.kicker);
  const setVisualization = useEditorStore((state) => state.setVisualization);
  const vrSupported = useVrSupported();
  const is3d = repType === "3d";

  return (
    <div className={styles.item}>
      <label className={styles.choice}>
        <input
          type="radio"
          name="representation"
          checked={!is3d}
          onChange={() => setVisualization({ repType: "2d" })}
        />
        <span>2d</span>
      </label>
      <label className={styles.choice}>
        <input
          type="radio"
          name="representation"
          checked={is3d}
          onChange={() => setVisualization({ repType: "3d" })}
        />
        <span>3d</span>
      </label>
      <label className={styles.choice}>
        <input
          type="checkbox"
          checked={textured}
          disabled={!is3d}
          onChange={(event) => setVisualization({ textured: event.target.checked })}
        />
        <span className="not-mobile">Textured</span>
        <span className="mobile-only">Tex.</span>
      </label>

      {/* Stereo rendering only makes sense on the 3D camera. */}
      {vrSupported && is3d && (
        <button
          type="button"
          className={styles.vrButton}
          aria-label="VR mode"
          onClick={() => void xrStore.enterVR()}
        >
          <svg width="31" height="31" viewBox="0 0 48 48" aria-hidden>
            <path d="M41.49,11L41.49,11H6.41C5.1,11,4,12.14,4,13.55v20.89C4,35.85,5.1,37,6.46,37h9.59c1.03,0,1.91-0.65,2.28-1.58l2.78-6.97c0.47-1.18,1.59-2,2.9-2c1.3,0,2.42,0.82,2.89,2l2.78,6.97c0.37,0.93,1.25,1.58,2.23,1.58h9.57C42.9,37,44,35.86,44,34.45V13.56C44,12.15,42.9,11,41.49,11z M15,28.25c-2.35,0-4.25-1.9-4.25-4.25s1.9-4.25,4.25-4.25s4.25,1.9,4.25,4.25S17.35,28.25,15,28.25z M33,28.25c-2.35,0-4.25-1.9-4.25-4.25s1.9-4.25,4.25-4.25s4.25,1.9,4.25,4.25S35.35,28.25,33,28.25z" />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * How many designs are still on their way to the server.
 *
 * Absent when there is nothing outstanding, which is the normal case: a save
 * that syncs immediately should not leave a permanent badge behind. Says
 * "waiting" rather than anything more alarming because nothing is wrong — the
 * designs are saved, and this is only about the share links.
 *
 * Absent entirely when the shell has no server behind it (the desktop app):
 * `pendingCount` is written by the outbox, which never runs there, so it
 * would always be zero anyway; the explicit gate spares the reader.
 */
function SyncStatus() {
  const pendingCount = useEditorStore((state) => state.pendingCount);
  const online = useOnline();

  if (!hasServer()) return null;
  if (pendingCount === 0) return null;

  const designs = pendingCount === 1 ? "1 design" : `${pendingCount} designs`;

  return (
    <span className={styles.syncStatus} role="status">
      <span className="not-mobile">
        {designs} saved here, {online ? "waiting for the server" : "waiting to sync"}
      </span>
      <span className="mobile-only">{pendingCount} to sync</span>
    </span>
  );
}

/** The strip above the drawing: sidebar toggle, units, and view mode. */
export function Toolbar() {
  const setSidebarOpen = useEditorStore((state) => state.setSidebarOpen);

  return (
    <div className={`${styles.toolbar} blueprint`}>
      <button
        type="button"
        className={`${styles.menuButton} not-desktop`}
        aria-label="menu"
        onClick={() => setSidebarOpen(true)}
      >
        <svg height="31" width="31" viewBox="0 0 32 32" className="inverted" aria-hidden>
          <path d="M4,10h24c1.104,0,2-0.896,2-2s-0.896-2-2-2H4C2.896,6,2,6.896,2,8S2.896,10,4,10z M28,14H4c-1.104,0-2,0.896-2,2  s0.896,2,2,2h24c1.104,0,2-0.896,2-2S29.104,14,28,14z M28,22H4c-1.104,0-2,0.896-2,2s0.896,2,2,2h24c1.104,0,2-0.896,2-2  S29.104,22,28,22z" />
        </svg>
      </button>
      {/* Grouped so that the toolbar's space-between still sees two children
          and the pickers do not move when the status appears. */}
      <div className={styles.group}>
        <UnitPicker />
        <SyncStatus />
      </div>
      <RepresentationPicker />
    </div>
  );
}
