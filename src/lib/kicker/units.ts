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
