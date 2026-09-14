import { beforeEach, describe, expect, it } from "vitest";
import { defaultKicker } from "@/lib/kicker";
import {
  canTransition,
  selectParametersLocked,
  selectResults,
  selectVisibleSteps,
  useEditorStore,
  type EditorMode,
} from "./editor-store";

const MODES: EditorMode[] = ["new", "ready", "saved", "readOnly"];

beforeEach(() => {
  useEditorStore.setState({
    kicker: defaultKicker,
    units: "m",
    mode: "new",
    editorOpen: false,
    sidebarOpen: false,
    step: "design",
    vrActive: false,
    alert: "",
  });
});

describe("mode transitions", () => {
  it("matches the legacy transition table", () => {
    const allowed = MODES.flatMap((from) =>
      MODES.filter((to) => canTransition(from, to)).map((to) => `${from} -> ${to}`),
    );
    expect(allowed).toEqual([
      "new -> new",
      "new -> ready",
      "ready -> new",
      "ready -> saved",
      "saved -> new",
      "saved -> ready",
      "saved -> readOnly",
      "readOnly -> new",
      "readOnly -> ready",
    ]);
  });

  it("rejects a disallowed jump", () => {
    expect(() => useEditorStore.getState().setMode("saved")).toThrow(
      /Transition from "new" to "saved" not allowed/,
    );
  });

  it("allows every state to be reset back to new", () => {
    for (const mode of MODES) {
      useEditorStore.setState({ mode });
      expect(() => useEditorStore.getState().setMode("new")).not.toThrow();
    }
  });
});

describe("opening the editor", () => {
  it("reveals the editor and makes it interactive", () => {
    useEditorStore.getState().openEditor();
    expect(useEditorStore.getState().editorOpen).toBe(true);
    expect(useEditorStore.getState().mode).toBe("ready");
  });

  it("leaves a loaded kicker read-only", () => {
    useEditorStore.getState().initialize({ mode: "readOnly" });
    useEditorStore.getState().openEditor();
    expect(useEditorStore.getState().mode).toBe("readOnly");
    expect(selectParametersLocked(useEditorStore.getState())).toBe(true);
  });
});

describe("parameters", () => {
  it("recomputes results when height or angle change", () => {
    const before = selectResults(useEditorStore.getState());
    useEditorStore.getState().setParameter("angle", 60);
    const after = selectResults(useEditorStore.getState());
    expect(after.radius).not.toBeCloseTo(before.radius);
    expect(after.radius).toBeCloseTo(2.4, 10);
  });

  it("leaves results alone when only width changes", () => {
    const before = selectResults(useEditorStore.getState());
    useEditorStore.getState().setParameter("width", 2.5);
    expect(selectResults(useEditorStore.getState())).toEqual(before);
    expect(useEditorStore.getState().kicker.width).toBe(2.5);
  });

  it("keeps visualization toggles independent of geometry", () => {
    const before = selectResults(useEditorStore.getState());
    useEditorStore.getState().setVisualization({ grid: false, mountainboard: true });
    expect(selectResults(useEditorStore.getState())).toEqual(before);
    expect(useEditorStore.getState().kicker.grid).toBe(false);
    expect(useEditorStore.getState().kicker.mountainboard).toBe(true);
  });
});

describe("visible steps", () => {
  it("offers Save but not Share on a fresh design", () => {
    useEditorStore.setState({ mode: "ready" });
    expect(selectVisibleSteps(useEditorStore.getState())).toEqual([
      "design",
      "visualize",
      "save",
    ]);
  });

  it("swaps Save for Share once a kicker is saved or loaded", () => {
    for (const mode of ["saved", "readOnly"] as const) {
      useEditorStore.setState({ mode });
      expect(selectVisibleSteps(useEditorStore.getState())).toEqual([
        "design",
        "visualize",
        "share",
      ]);
    }
  });
});

describe("reset", () => {
  it("restores defaults and returns to the first step", () => {
    useEditorStore.getState().setParameter("height", 2.5);
    useEditorStore.getState().setVisualization({ grid: false });
    useEditorStore.getState().goToStep("visualize");
    useEditorStore.getState().setAlert("boom");

    useEditorStore.getState().resetToDefaults();

    expect(useEditorStore.getState().kicker).toEqual(defaultKicker);
    expect(useEditorStore.getState().step).toBe("design");
    expect(useEditorStore.getState().alert).toBe("");
    expect(useEditorStore.getState().mode).toBe("ready");
  });
});
