import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEditorStore } from "@/store/editor-store";
import {
  browserLanguageUnits,
  parseUnit,
  preferredUnits,
  readStoredUnits,
  storeUnits,
  UNITS_STORAGE_KEY,
} from "./units-preference";

/**
 * The tests run under node, which has neither of the two browser globals this
 * module reaches for, so both are installed here. Being absent is itself a
 * case worth covering, which is what the "without a browser" block does by
 * leaving them off.
 */
function fakeStorage(initial: Record<string, string> = {}) {
  const entries = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => void entries.set(key, value),
    removeItem: (key: string) => void entries.delete(key),
    clear: () => entries.clear(),
    key: (index: number) => [...entries.keys()][index] ?? null,
    get length() {
      return entries.size;
    },
  } satisfies Storage;
}

function useFakeBrowser(options: { storage?: Storage; languages?: readonly string[] } = {}) {
  vi.stubGlobal("window", {});
  vi.stubGlobal("localStorage", options.storage ?? fakeStorage());
  vi.stubGlobal("navigator", { languages: options.languages ?? ["en-GB", "en"] });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("parseUnit", () => {
  it("takes the two units", () => {
    expect(parseUnit("m")).toBe("m");
    expect(parseUnit("ft")).toBe("ft");
  });

  /*
   * Storage is shared with everything else on the origin and survives every
   * deployment, so whatever comes back out of it is untrusted input.
   */
  it("rejects anything else", () => {
    expect(parseUnit("metres")).toBeNull();
    expect(parseUnit("")).toBeNull();
    expect(parseUnit(null)).toBeNull();
    expect(parseUnit(undefined)).toBeNull();
    expect(parseUnit("__proto__")).toBeNull();
  });
});

describe("the stored choice", () => {
  it("round-trips", () => {
    useFakeBrowser();

    storeUnits("ft");
    expect(readStoredUnits()).toBe("ft");

    storeUnits("m");
    expect(readStoredUnits()).toBe("m");
  });

  it("ignores a corrupt value", () => {
    useFakeBrowser({ storage: fakeStorage({ [UNITS_STORAGE_KEY]: "cubits" }) });

    expect(readStoredUnits()).toBeNull();
  });

  /*
   * Safari in private browsing, storage disabled by policy and a full quota
   * all throw here. Losing the preference is acceptable; failing to change the
   * unit is not.
   */
  it("survives storage that throws", () => {
    const broken: Storage = {
      ...fakeStorage(),
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
    };
    useFakeBrowser({ storage: broken });

    expect(readStoredUnits()).toBeNull();
    expect(() => storeUnits("ft")).not.toThrow();
  });
});

describe("preferredUnits", () => {
  it("prefers what was chosen over what the language suggests", () => {
    useFakeBrowser({
      storage: fakeStorage({ [UNITS_STORAGE_KEY]: "m" }),
      languages: ["en-US", "en"],
    });

    expect(preferredUnits()).toBe("m");
  });

  it("falls back to the language when nothing was chosen", () => {
    useFakeBrowser({ languages: ["en-US", "en"] });
    expect(preferredUnits()).toBe("ft");

    vi.unstubAllGlobals();
    useFakeBrowser({ languages: ["fr-FR", "fr"] });
    expect(preferredUnits()).toBe("m");
  });

  /*
   * A build is the case that matters: node has its own global `navigator`
   * carrying the build machine's locale, so anything keying off that would
   * prerender the offline shell in whatever units the machine happened to use.
   */
  it("defaults to meters without a browser, whatever node's own locale says", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("navigator", { languages: ["en-US"] });

    expect(preferredUnits()).toBe("m");
    expect(browserLanguageUnits()).toBe("m");
  });
});

describe("the store's unit field", () => {
  beforeEach(() => {
    useEditorStore.setState({ units: "m" });
  });

  /*
   * The masthead toggle and the editor's both call setUnits, so this is what
   * makes either of them remember the choice.
   */
  it("writes a deliberate change through to storage", () => {
    useFakeBrowser();

    useEditorStore.getState().setUnits("ft");

    expect(useEditorStore.getState().units).toBe("ft");
    expect(readStoredUnits()).toBe("ft");
  });

  /*
   * initialize carries the server's guess from Accept-Language. Storing that
   * would turn a guess into a decision, and the visitor would keep it even
   * after changing their browser's language.
   */
  it("does not store the starting guess", () => {
    useFakeBrowser();

    useEditorStore.getState().initialize({ units: "ft" });

    expect(useEditorStore.getState().units).toBe("ft");
    expect(readStoredUnits()).toBeNull();
  });
});
