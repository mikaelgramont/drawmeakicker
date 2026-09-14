import { useMemo } from "react";
import { create } from "zustand";
import {
  calculateResults,
  defaultKicker,
  type Kicker,
  type KickerResults,
  type RepresentationType,
  type Unit,
} from "@/lib/kicker";
import type { ShareLinks } from "@/lib/share";

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

/**
 * The server-rendered starting point, from `?id=` and the request headers.
 * Every field is optional and anything omitted keeps its current value, so
 * this only ever adds to the defaults; clearing is `resetToDefaults`' job.
 */
export interface EditorInit {
  kicker?: Partial<Kicker>;
  units?: Unit;
  mode?: EditorMode;
  /** The id of the kicker being viewed, when the page was loaded from `?id=`. */
  savedId?: number;
  share?: ShareLinks;
  alert?: string;
  /** Skip the pitch and reveal the editor, as the legacy autoStart flag did. */
  editorOpen?: boolean;
}

export interface EditorState {
  kicker: Kicker;
  units: Unit;
  mode: EditorMode;

  /**
   * The id this kicker is reachable at, or null while it is unsaved. Set
   * either by loading `?id=` or by a successful save.
   */
  savedId: number | null;
  /** Share links for `savedId`, built by the server. */
  share: ShareLinks | null;
  /** Whether a save is in flight, which disables the form as bihi-save did. */
  saving: boolean;

  /** Whether the editor has been revealed (the legacy `expanded-editor` body class). */
  editorOpen: boolean;
  /** Whether the slide-out sidebar is showing on narrow viewports. */
  sidebarOpen: boolean;
  step: Step;
  vrActive: boolean;
  alert: string;

  initialize(input: EditorInit): void;
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

  setSaving(saving: boolean): void;
  markSaved(input: { id: number; kicker: Kicker; share: ShareLinks }): void;
}

export const useEditorStore = create<EditorState>()((set, get) => ({
  kicker: defaultKicker,
  units: "m",
  mode: "new",

  savedId: null,
  share: null,
  saving: false,

  editorOpen: false,
  sidebarOpen: false,
  step: "design",
  vrActive: false,
  alert: "",

  initialize: ({ kicker, units, mode, savedId, share, alert, editorOpen }) =>
    set((state) => ({
      kicker: { ...state.kicker, ...kicker },
      units: units ?? state.units,
      mode: mode ?? state.mode,
      savedId: savedId ?? state.savedId,
      share: share ?? state.share,
      alert: alert ?? state.alert,
      editorOpen: editorOpen ?? state.editorOpen,
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
    set({
      kicker: defaultKicker,
      mode: "ready",
      step: "design",
      alert: "",
      savedId: null,
      share: null,
      saving: false,
    }),

  goToStep: (step) => set({ step, sidebarOpen: false }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setVrActive: (vrActive) => set({ vrActive }),
  setAlert: (alert) => set({ alert }),

  setSaving: (saving) => set({ saving }),

  /**
   * Accepts the save response: the kicker now has an id and share links, and
   * the accordion lands on Share, as the SAVED branch of bihi-editor did.
   *
   * The title and description come back from the server rather than being
   * kept from the form, so what is displayed is what was actually stored.
   */
  markSaved: ({ id, kicker, share }) => {
    get().setMode("saved");
    set({ kicker, savedId: id, share, saving: false, step: "share", alert: "" });
  },
}));

/**
 * Unlocks a loaded kicker so it can be used as the basis for a new design.
 *
 * The geometry is kept and only the identity is dropped, which is what
 * bihi-editor's reset(true) amounted to: strip the id from the URL, clear the
 * notes, re-enable the parameters. Clearing the notes matters because saving
 * mints a new row, and inheriting someone else's title silently would be
 * worse than starting blank.
 */
export function startDerivative(): void {
  const { setMode, kicker } = useEditorStore.getState();
  setMode("ready");
  useEditorStore.setState({
    kicker: { ...kicker, title: "", description: "" },
    savedId: null,
    share: null,
    step: "design",
  });
}

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

/*
 * The two selectors above build a fresh object on every call, so they cannot
 * be handed to useEditorStore directly: the subscription compares snapshots by
 * identity and would re-render forever. These hooks subscribe to the primitives
 * the derivation actually depends on and memoize the result.
 */

export function useResults(): KickerResults {
  const height = useEditorStore((state) => state.kicker.height);
  const angle = useEditorStore((state) => state.kicker.angle);
  return useMemo(() => calculateResults(height, angle), [height, angle]);
}

export function useVisibleSteps(): readonly Step[] {
  const mode = useEditorStore((state) => state.mode);
  return useMemo(() => selectVisibleSteps({ mode } as EditorState), [mode]);
}
