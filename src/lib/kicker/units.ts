/**
 * Unit formatting, ported from Utils.metersToDumb and
 * Representation3D.getHumanReadableDimension_ in the legacy app.
 */
import { DEGREES, type Unit } from "./types";

const ONE_FOOT = 0.3048;
const INCHES_PER_FOOT = 12;

/**
 * Formats meters as feet and inches.
 *
 * The legacy implementation divided by 0.0253 instead of 0.0254, truncated the
 * inches instead of rounding, and emitted no unit for them ("3ft11").
 */
export function metersToFeetAndInches(meters: number): string {
  const totalInches = Math.round((meters / ONE_FOOT) * INCHES_PER_FOOT);
  const feet = Math.floor(totalInches / INCHES_PER_FOOT);
  const inches = totalInches % INCHES_PER_FOOT;

  return inches === 0 ? `${feet}ft` : `${feet}ft ${inches}in`;
}

/** Formats a length in the user's chosen unit, for labels and annotations. */
export function formatLength(meters: number, unit: Unit): string {
  return unit === "ft" ? metersToFeetAndInches(meters) : `${meters.toFixed(2)}m`;
}

/** Formats an angle. Always degrees; the unit toggle does not apply. */
export function formatAngle(degrees: number): string {
  return `${degrees.toFixed(0)}${DEGREES}`;
}

/**
 * Which unit to start a visitor off in, from their Accept-Language header.
 *
 * Only the head of the list counts, as in the legacy check in
 * legacy/public/index.php: someone whose first preference is French gets
 * meters even if en-US appears further down.
 *
 * Feet go to exactly `en-US` and nothing else. The legacy version also gave
 * them to `en-CA`, which is wrong — Canada is metric for this sort of thing —
 * and the tag has to match in full, so `en-US-POSIX` gets meters too. Anyone
 * this guesses wrong for is one click from fixing it for good, which is what
 * the toggle in the masthead is for.
 */
export function unitsForLanguage(acceptLanguage: string | null | undefined): Unit {
  if (!acceptLanguage) return "m";

  // "en-US,en;q=0.9" and "en-US;q=0.9" both have "en-US" as their first tag.
  const first = acceptLanguage.split(",")[0].split(";")[0].trim();
  return first.toLowerCase() === "en-us" ? "ft" : "m";
}
