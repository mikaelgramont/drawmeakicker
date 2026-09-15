import { beforeEach, describe, expect, it } from "vitest";
import { defaultKicker } from "@/lib/kicker";
import type { LocalDesign } from "@/lib/local/designs";
import type { ShareLinks } from "@/lib/share";
import {
  canTransition,
  selectParametersLocked,
  selectResults,
  selectVisibleSteps,
  startDerivative,
  useEditorStore,
  type EditorMode,
} from "./editor-store";

const MODES: EditorMode[] = ["new", "ready", "saved", "readOnly"];

const share: ShareLinks = {
  twitterUrl: "https://twitter.com/intent/tweet?url=x",
  facebookUrl: "https://www.facebook.com/sharer.php?u=x",
};

beforeEach(() => {
  useEditorStore.setState({
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
      "library",
    ]);
  });

  it("swaps Save for Share once a kicker is saved or loaded", () => {
    for (const mode of ["saved", "readOnly"] as const) {
      useEditorStore.setState({ mode });
      expect(selectVisibleSteps(useEditorStore.getState())).toEqual([
        "design",
        "visualize",
        "share",
        "library",
      ]);
    }
  });

  /*
   * The library reaches designs other than the one on screen, so hiding it in
   * any mode would mean a design saved during an outage could become
   * unreachable from the app that saved it.
   */
  it("always offers the library", () => {
    for (const mode of MODES) {
      useEditorStore.setState({ mode });
      expect(selectVisibleSteps(useEditorStore.getState())).toContain("library");
    }
  });
});

const design: LocalDesign = {
  localId: "local-1",
  kicker: { ...defaultKicker, title: "Le gros", description: "Steep" },
  serverId: null,
  share: null,
  syncState: "pending",
  savedAt: 1,
  error: null,
  attempts: 0,
  claimedAt: null,
  nextAttemptAt: null,
};

describe("saving locally", () => {
  beforeEach(() => {
    useEditorStore.setState({ mode: "ready", step: "save" });
  });

  /*
   * The save completes without the server. It used to be the save response
   * that moved the editor on, which meant an outage left the user on the Save
   * step with an error and nothing kept.
   */
  it("lands on the share step with no server identity yet", () => {
    useEditorStore.getState().markSavedLocally(design);
    const state = useEditorStore.getState();

    expect(state.mode).toBe("saved");
    expect(state.localId).toBe("local-1");
    expect(state.syncState).toBe("pending");
    expect(state.savedId).toBeNull();
    expect(state.share).toBeNull();
    expect(state.step).toBe("share");
    expect(state.saving).toBe(false);
    expect(selectVisibleSteps(state)).toContain("share");
  });

  it("leaves the kicker alone", () => {
    useEditorStore.setState({ kicker: { ...defaultKicker, height: 2.4 } });
    useEditorStore.getState().markSavedLocally(design);

    expect(useEditorStore.getState().kicker.height).toBe(2.4);
  });
});

describe("a sync coming back", () => {
  beforeEach(() => {
    useEditorStore.setState({ mode: "ready", step: "save" });
    useEditorStore.getState().markSavedLocally(design);
  });

  it("fills in the id and share links", () => {
    useEditorStore.getState().applySyncResult({
      ...design,
      serverId: 7,
      share,
      syncState: "synced",
    });
    const state = useEditorStore.getState();

    expect(state.savedId).toBe(7);
    expect(state.share).toEqual(share);
    expect(state.syncState).toBe("synced");
  });

  it("records a rejection without touching the kicker", () => {
    useEditorStore.getState().applySyncResult({
      ...design,
      syncState: "failed",
      error: "height: too big",
    });
    const state = useEditorStore.getState();

    expect(state.syncState).toBe("failed");
    expect(state.savedId).toBeNull();
    expect(state.kicker).toEqual(useEditorStore.getState().kicker);
  });

  /*
   * A drain works through the whole library, so a result can arrive for a
   * design the user has since navigated away from. Applying it would put
   * somebody else's share link on whatever is now on screen.
   */
  it("is ignored when it is for a design that is no longer open", () => {
    useEditorStore.getState().applySyncResult({
      ...design,
      localId: "some-other-design",
      serverId: 99,
      share,
      syncState: "synced",
    });
    const state = useEditorStore.getState();

    expect(state.savedId).toBeNull();
    expect(state.share).toBeNull();
    expect(state.syncState).toBe("pending");
  });
});

describe("opening a design from the library", () => {
  const stored: LocalDesign = {
    ...design,
    localId: "local-2",
    kicker: { ...defaultKicker, height: 2.4, title: "From the library" },
    serverId: 9,
    share,
    syncState: "synced",
  };

  /*
   * The transition table has no edge into `saved` from `new` or `readOnly`, so
   * this has to be reachable from wherever the user happens to be rather than
   * only from `ready`.
   */
  it("works from every mode", () => {
    for (const mode of MODES) {
      useEditorStore.setState({ mode, localId: null, syncState: null });
      expect(() => useEditorStore.getState().openDesign(stored)).not.toThrow();
      expect(useEditorStore.getState().mode).toBe("saved");
    }
  });

  it("adopts the design's kicker and identity", () => {
    useEditorStore.setState({ mode: "ready" });
    useEditorStore.getState().openDesign(stored);
    const state = useEditorStore.getState();

    expect(state.kicker).toEqual(stored.kicker);
    expect(state.localId).toBe("local-2");
    expect(state.savedId).toBe(9);
    expect(state.share).toEqual(share);
    expect(state.syncState).toBe("synced");
    expect(state.step).toBe("share");
  });

  it("carries over an unsynced design without inventing an id for it", () => {
    useEditorStore.setState({ mode: "ready" });
    useEditorStore.getState().openDesign({ ...stored, serverId: null, share: null, syncState: "pending" });
    const state = useEditorStore.getState();

    expect(state.savedId).toBeNull();
    expect(state.share).toBeNull();
    expect(state.syncState).toBe("pending");
  });

  /*
   * Opening one design and then having the previous one's sync come back must
   * not put the old share link onto the new design.
   */
  it("redirects later sync results at the newly opened design", () => {
    useEditorStore.setState({ mode: "ready" });
    useEditorStore.getState().openDesign({ ...stored, serverId: null, share: null, syncState: "pending" });

    useEditorStore.getState().applySyncResult({ ...design, serverId: 1, share, syncState: "synced" });
    expect(useEditorStore.getState().savedId).toBeNull();

    useEditorStore.getState().applySyncResult({ ...stored, serverId: 4, share, syncState: "synced" });
    expect(useEditorStore.getState().savedId).toBe(4);
  });
});

describe("recognising a server-resolved link as one of ours", () => {
  const stored: LocalDesign = {
    ...design,
    localId: "local-3",
    kicker: { ...defaultKicker, height: 3.1, title: "Mine, from the server" },
    serverId: 12,
    share,
    syncState: "synced",
  };

  /*
   * The kicker on screen came from the server, which is authoritative for a
   * shared link, and may be newer than whatever this device happens to hold.
   * Only the handle is taken.
   */
  it("takes the local identity and leaves the kicker alone", () => {
    useEditorStore.setState({
      mode: "readOnly",
      kicker: { ...defaultKicker, height: 9.9 },
      savedId: 12,
      share,
      localId: null,
      syncState: null,
    });

    useEditorStore.getState().adoptLocalIdentity(stored);
    const state = useEditorStore.getState();

    expect(state.localId).toBe("local-3");
    expect(state.syncState).toBe("synced");
    expect(state.kicker.height).toBe(9.9);
    expect(state.mode).toBe("readOnly");
  });

  /*
   * The point of adopting the handle at all: a sync finishing for this design
   * would otherwise be discarded as belonging to something else.
   */
  it("lets a later sync result reach the design", () => {
    useEditorStore.setState({ mode: "readOnly", localId: null, savedId: null, share: null });
    useEditorStore.getState().adoptLocalIdentity({ ...stored, serverId: null, share: null, syncState: "pending" });

    useEditorStore.getState().applySyncResult({ ...stored, serverId: 12, share, syncState: "synced" });
    expect(useEditorStore.getState().savedId).toBe(12);
  });
});

describe("modifying a loaded kicker", () => {
  beforeEach(() => {
    useEditorStore.setState({
      mode: "readOnly",
      savedId: 7,
      share,
      localId: "local-1",
      syncState: "synced",
      kicker: { ...defaultKicker, height: 2.4, title: "Le gros", description: "Steep" },
    });
  });

  it("keeps the dimensions but drops the identity", () => {
    startDerivative();
    const state = useEditorStore.getState();

    expect(state.kicker.height).toBe(2.4);
    expect(state.kicker.title).toBe("");
    expect(state.kicker.description).toBe("");
    expect(state.savedId).toBeNull();
    expect(state.share).toBeNull();
  });

  /*
   * The local handle has to go too. Keeping it would aim the next sync result
   * at the record the derivative came from, so saving would appear to hand the
   * new design the old one's share link.
   */
  it("drops the local handle as well as the server one", () => {
    startDerivative();
    const state = useEditorStore.getState();

    expect(state.localId).toBeNull();
    expect(state.syncState).toBeNull();
  });

  it("unlocks the parameters and offers Save again", () => {
    startDerivative();
    const state = useEditorStore.getState();

    expect(state.mode).toBe("ready");
    expect(selectParametersLocked(state)).toBe(false);
    expect(selectVisibleSteps(state)).toContain("save");
    expect(selectVisibleSteps(state)).not.toContain("share");
  });
});

describe("initializing from the server", () => {
  it("opens a loaded kicker read-only, with its share links", () => {
    useEditorStore.getState().initialize({
      kicker: { ...defaultKicker, height: 2.4, title: "Le gros" },
      units: "ft",
      mode: "readOnly",
      savedId: 7,
      share,
      editorOpen: true,
    });
    const state = useEditorStore.getState();

    expect(state.mode).toBe("readOnly");
    expect(state.units).toBe("ft");
    expect(state.savedId).toBe(7);
    expect(state.editorOpen).toBe(true);
    expect(selectParametersLocked(state)).toBe(true);
  });

  it("leaves a plain visit on the defaults", () => {
    useEditorStore.getState().initialize({ units: "ft" });
    const state = useEditorStore.getState();

    expect(state.kicker).toEqual(defaultKicker);
    expect(state.savedId).toBeNull();
    expect(state.editorOpen).toBe(false);
    expect(state.mode).toBe("new");
  });

  it("carries a message through to the alert banner", () => {
    useEditorStore.getState().initialize({ alert: "We could not find that kicker." });
    expect(useEditorStore.getState().alert).toBe("We could not find that kicker.");
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

  it("drops the identity of a kicker that had been saved", () => {
    useEditorStore.setState({ mode: "saved", savedId: 7, share });

    useEditorStore.getState().resetToDefaults();

    expect(useEditorStore.getState().savedId).toBeNull();
    expect(useEditorStore.getState().share).toBeNull();
  });
});
