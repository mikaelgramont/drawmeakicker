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
import type { LocalDesign, SyncState } from "@/lib/local/designs";
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

/**
 * The accordion steps, in order.
 *
 * `library` is not a step in the sequence so much as a drawer at the end of it,
 * which is why it sits last and is always reachable.
 */
export const STEPS = ["design", "visualize", "save", "share", "library"] as const;
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
  /**
   * Set when a `?id=` link was answered out of the local library rather than by
   * the server, which is how a shared link still opens during an outage.
   */
  localId?: string;
  syncState?: SyncState;
  alert?: string;
  /** Skip the pitch and reveal the editor, as the legacy autoStart flag did. */
  editorOpen?: boolean;
}

export interface EditorState {
  kicker: Kicker;
  units: Unit;
  mode: EditorMode;

  /**
   * The id this kicker is reachable at, or null while the server has not seen
   * it. Set either by loading `?id=` or once a sync comes back.
   */
  savedId: number | null;
  /** Share links for `savedId`, built by the server. */
  share: ShareLinks | null;
  /** Whether a save is in flight, which disables the form as bihi-save did. */
  saving: boolean;

  /**
   * The open design's handle in the local library, set as soon as it is saved.
   *
   * This, not `savedId`, is what says the work is safe: it exists the moment
   * the design is on disk, whereas `savedId` waits on a server that may be
   * hours away.
   */
  localId: string | null;
  /** How the open design's sync is going, or null when it was never saved. */
  syncState: SyncState | null;
  /** How many designs in the whole library are still waiting on the server. */
  pendingCount: number;

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
  markSavedLocally(design: LocalDesign): void;
  applySyncResult(design: LocalDesign): void;
  setPendingCount(count: number): void;
  openDesign(design: LocalDesign): void;
  adoptLocalIdentity(design: LocalDesign): void;
}

export const useEditorStore = create<EditorState>()((set, get) => ({
  kicker: defaultKicker,
  units: "m",
  mode: "new",

  savedId: null,
  share: null,
  saving: false,

  localId: null,
  syncState: null,
  pendingCount: 0,

  editorOpen: false,
  sidebarOpen: false,
  step: "design",
  vrActive: false,
  alert: "",

  initialize: ({ kicker, units, mode, savedId, share, localId, syncState, alert, editorOpen }) =>
    set((state) => ({
      kicker: { ...state.kicker, ...kicker },
      units: units ?? state.units,
      mode: mode ?? state.mode,
      savedId: savedId ?? state.savedId,
      share: share ?? state.share,
      localId: localId ?? state.localId,
      syncState: syncState ?? state.syncState,
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
      // Dropped along with the server identity: keeping it would point a fresh
      // design at the previous one's record, and the next sync result would be
      // applied to the wrong thing.
      localId: null,
      syncState: null,
    }),

  goToStep: (step) => set({ step, sidebarOpen: false }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setVrActive: (vrActive) => set({ vrActive }),
  setAlert: (alert) => set({ alert }),

  setSaving: (saving) => set({ saving }),

  /**
   * Accepts a design that is now on disk, and lands the accordion on Share as
   * the SAVED branch of bihi-editor did.
   *
   * This is where the save ends as far as the user is concerned. It used to
   * wait on the server's response, which meant a failed request left them on
   * the Save step with an error and nothing kept; now the server is only ever
   * responsible for `savedId` and `share`, which arrive later if at all.
   *
   * The kicker is not replaced. The old version took the title and description
   * back from the save response so that what was displayed was what had been
   * stored — with the local library that is already true, and the server's echo
   * is no longer the thing that decides it.
   */
  markSavedLocally: (design) => {
    get().setMode("saved");
    set({
      localId: design.localId,
      savedId: design.serverId,
      share: design.share,
      syncState: design.syncState,
      saving: false,
      step: "share",
      alert: "",
    });
  },

  /**
   * Reflects what a sync learned about the open design.
   *
   * Ignores designs that are not on screen: a drain works through the whole
   * library, and by the time it reports back the user may well have started
   * something else.
   */
  applySyncResult: (design) => {
    if (get().localId !== design.localId) return;
    set({ syncState: design.syncState, savedId: design.serverId, share: design.share });
  },

  setPendingCount: (pendingCount) => set({ pendingCount }),

  /**
   * Loads a design out of the library and onto the screen.
   *
   * Goes through `ready` because the transition table has no edge into `saved`
   * from `new` or `readOnly`, and this can be called from either. The
   * intermediate hop is what the table permits rather than a trick around it:
   * a design being opened really does pass through being editable.
   */
  openDesign: (design) => {
    const { setMode } = get();
    setMode("ready");
    setMode("saved");
    set({
      kicker: design.kicker,
      localId: design.localId,
      savedId: design.serverId,
      share: design.share,
      syncState: design.syncState,
      step: "share",
      alert: "",
      sidebarOpen: false,
    });
  },

  /**
   * Notes that the design the server just handed us is one we already have.
   *
   * A `?id=` link resolved by the server arrives with an id and share links but
   * no idea which local record it corresponds to, so without this the library
   * would not mark it as the design on screen and a sync finishing for it would
   * be discarded as belonging to something else. Only the identity is taken:
   * the kicker on screen came from the server and stays as it is.
   */
  adoptLocalIdentity: (design) =>
    set({ localId: design.localId, syncState: design.syncState }),
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
    localId: null,
    syncState: null,
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
 * bihi-editor showSave/showShare logic. Library is always there, since its
 * whole job is to reach designs that are not the one on screen.
 */
export function selectVisibleSteps(state: EditorState): readonly Step[] {
  const shared = state.mode === "readOnly" || state.mode === "saved";
  return STEPS.filter((step) => {
    if (step === "library") return true;
    if (step === "share") return shared;
    if (step === "save") return !shared;
    return true;
  });
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
