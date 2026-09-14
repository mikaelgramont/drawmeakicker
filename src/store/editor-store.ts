import { create } from "zustand";
import {
  calculateResults,
  defaultKicker,
  type Kicker,
  type KickerResults,
  type RepresentationType,
  type Unit,
} from "@/lib/kicker";

/**
 * Replaces EditorState in legacy/public/scripts/editorstate.js. Same four
 * states and the same allowed transitions, minus the `published-state-change`
 * CustomEvent broadcast: subscribers read the store instead.
 */
export type EditorMode = "new" | "ready" | "saved" | "readOnly";

const ALLOWED_TRANSITIONS: Record<EditorMode, readonly EditorMode[]> = {
  new: ["new", "ready"],
  ready: ["new", "saved"],
  saved: ["new", "ready", "readOnly"],
  readOnly: ["new", "ready"],
};

export function canTransition(from: EditorMode, to: EditorMode): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** The toggles that only affect what is drawn, never the geometry. */
export type VisualizationPatch = Partial<
  Pick<
    Kicker,
    "repType" | "textured" | "annotations" | "grid" | "mountainboard" | "rider" | "fill" | "borders"
  >
>;

/** The four accordion steps, in order. */
export const STEPS = ["design", "visualize", "save", "share"] as const;
export type Step = (typeof STEPS)[number];

export interface EditorState {
  kicker: Kicker;
  units: Unit;
  mode: EditorMode;

  /** Whether the editor has been revealed (the legacy `expanded-editor` body class). */
  editorOpen: boolean;
  /** Whether the slide-out sidebar is showing on narrow viewports. */
  sidebarOpen: boolean;
  step: Step;
  vrActive: boolean;
  alert: string;

  initialize(input: { kicker?: Partial<Kicker>; units?: Unit; mode?: EditorMode }): void;
  setParameter(name: "height" | "width" | "angle", value: number): void;
  setVisualization(patch: VisualizationPatch): void;
  setRepresentation(repType: RepresentationType): void;
  setSaveFields(patch: Pick<Kicker, "title"> | Pick<Kicker, "description">): void;
  setUnits(units: Unit): void;

  openEditor(): void;
  setMode(mode: EditorMode): void;
  resetToDefaults(): void;
  goToStep(step: Step): void;
  setSidebarOpen(open: boolean): void;
  setVrActive(active: boolean): void;
  setAlert(message: string): void;
}

export const useEditorStore = create<EditorState>()((set, get) => ({
  kicker: defaultKicker,
  units: "m",
  mode: "new",

  editorOpen: false,
  sidebarOpen: false,
  step: "design",
  vrActive: false,
  alert: "",

  initialize: ({ kicker, units, mode }) =>
    set((state) => ({
      kicker: { ...state.kicker, ...kicker },
      units: units ?? state.units,
      mode: mode ?? state.mode,
    })),

  setParameter: (name, value) =>
    set((state) => ({ kicker: { ...state.kicker, [name]: value } })),

  setVisualization: (patch) => set((state) => ({ kicker: { ...state.kicker, ...patch } })),

  setRepresentation: (repType) =>
    set((state) => ({ kicker: { ...state.kicker, repType } })),

  setSaveFields: (patch) => set((state) => ({ kicker: { ...state.kicker, ...patch } })),

  setUnits: (units) => set({ units }),

  openEditor: () => {
    set({ editorOpen: true });
    // Revealing the editor is what makes it interactive, so leave the initial
    // state behind here rather than on mount.
    if (get().mode === "new") get().setMode("ready");
  },

  setMode: (mode) => {
    const current = get().mode;
    if (current === mode) return;
    if (!canTransition(current, mode)) {
      throw new Error(`Transition from "${current}" to "${mode}" not allowed.`);
    }
    set({ mode });
  },

  resetToDefaults: () =>
    set({ kicker: defaultKicker, mode: "ready", step: "design", alert: "" }),

  goToStep: (step) => set({ step, sidebarOpen: false }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setVrActive: (vrActive) => set({ vrActive }),
  setAlert: (alert) => set({ alert }),
}));

/** Derived dimensions. Recomputed from height/angle rather than stored. */
export function selectResults(state: EditorState): KickerResults {
  return calculateResults(state.kicker.height, state.kicker.angle);
}

/**
 * Which accordion steps are reachable. Loading someone else's kicker hides
 * Save and shows Share; a fresh design does the opposite, matching the
 * bihi-editor showSave/showShare logic.
 */
export function selectVisibleSteps(state: EditorState): readonly Step[] {
  const shared = state.mode === "readOnly" || state.mode === "saved";
  return STEPS.filter((step) => (step === "share" ? shared : step !== "save" || !shared));
}

/** Parameters are locked while viewing a saved kicker. */
export function selectParametersLocked(state: EditorState): boolean {
  return state.mode === "readOnly";
}
