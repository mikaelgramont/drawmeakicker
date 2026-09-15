/**
 * Where the chosen unit is kept between visits.
 *
 * The unit used to be worked out per request from `Accept-Language` and then
 * forgotten, so someone the guess was wrong for re-picked it every time. Now
 * the guess is only the starting point and an explicit choice outlives it.
 *
 * Local storage rather than a cookie, which means the server never sees it and
 * the whole thing keeps working with no network. The cost is that the first
 * render of a visit is still the language guess: the server has nothing else to
 * go on, so a returning visitor whose choice differs from their language sees
 * it corrected once the page starts running.
 */
import { UNITS, unitsForLanguage, type Unit } from "@/lib/kicker";

export const UNITS_STORAGE_KEY = "drawmeakicker.units";

/** Reads a stored value back, rejecting anything that is not a unit. */
export function parseUnit(raw: string | null | undefined): Unit | null {
  return UNITS.includes(raw as Unit) ? (raw as Unit) : null;
}

/*
 * Local storage throws rather than degrading in a few real situations: Safari
 * in private browsing, storage disabled by policy, and a full quota. None of
 * them are worth failing a unit change over, so reads fall back to the guess
 * and writes are allowed to be forgotten.
 */

export function readStoredUnits(): Unit | null {
  try {
    return parseUnit(localStorage.getItem(UNITS_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function storeUnits(units: Unit): void {
  try {
    localStorage.setItem(UNITS_STORAGE_KEY, units);
  } catch {
    // Kept for this session only, which is the most that can be offered.
  }
}

/**
 * Whether there is a real browser to ask.
 *
 * `window` and not `navigator`: node has had a global `navigator` since v21,
 * carrying the machine's own locale, so testing for that one finds it during a
 * build and quietly bakes the build machine's units into prerendered HTML.
 */
function inBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * The guess from the visitor's language, for when there is no server to make
 * it.
 *
 * `navigator.languages` is joined into the shape `unitsForLanguage` was
 * written for. It carries the same preferences in the same order as the
 * `Accept-Language` header the server reads, so both arrive at the same guess.
 */
export function browserLanguageUnits(): Unit {
  if (!inBrowser()) return "m";
  return unitsForLanguage(navigator.languages.join(","));
}

/** The stored choice if there is one, and otherwise that guess. */
export function preferredUnits(): Unit {
  return readStoredUnits() ?? browserLanguageUnits();
}
