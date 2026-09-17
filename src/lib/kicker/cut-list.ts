/**
 * The cut list: every piece of timber the ramp is built from, sized from the
 * same geometry the scene extrudes.
 *
 * Nothing here decides how the pieces are laid out on a sheet or how much
 * material to buy — that involves a nesting algorithm and a choice of sheet
 * size, neither of which the app knows about. It reports what has to be cut,
 * and leaves it to the builder to decide how to buy the material for it.
 *
 * Kept free of the drawing layer so the numbers this returns and the drawing
 * on page two of the PDF cannot disagree about what is being built.
 */
import { kickerConfig } from "./config";
import {
  calculateResults,
  calculateSidePoints,
  calculateStrutPlacements,
} from "./geometry";
import type { Kicker } from "./types";

/**
 * A flat sheet cut from plywood. Reported as a rectangle even when the piece
 * has a curved edge, because that is the material a builder has to buy: the
 * curve is achieved by trimming waste off the corner of the rectangle.
 */
export interface CutSheet {
  kind: "sheet";
  /** How the piece is used in the ramp. */
  caption: string;
  quantity: number;
  /** Sheet thickness, in metres. */
  thickness: number;
  /** The longer dimension of the bounding rectangle, in metres. */
  length: number;
  /** The shorter dimension of the bounding rectangle, in metres. */
  width: number;
  /** Whether one edge is curved. Displayed as a note beside the dimensions. */
  curved?: boolean;
}

/** A length of square-section timber, cut to fit under the deck. */
export interface CutBeam {
  kind: "beam";
  caption: string;
  quantity: number;
  /** Side of the square cross-section, in metres. */
  section: number;
  /** How long each piece is cut to, in metres. */
  length: number;
}

export type CutPiece = CutSheet | CutBeam;

/**
 * Bounding rectangle of the side panel outline: how big a sheet has to be to
 * cut one cheek out of, before the top curve is trimmed.
 *
 * `calculateSidePoints` returns the outline in metres with the entry corner at
 * the origin, so max(x) is the footprint and max(y) is the lip height. `min`
 * is 0 for both — the panel sits on the ground and against the origin — but
 * this reads them out anyway rather than asserting.
 */
function cheekBounds(angleDeg: number, radius: number): { length: number; height: number } {
  const points = calculateSidePoints(angleDeg, radius);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  return { length: maxX - minX, height: maxY - minY };
}

/**
 * The cut list for a given kicker.
 *
 * Pieces are listed in build order: the frame first, then the two cheeks that
 * hold it in shape, then the deck laid on top.
 */
export function calculateCutList(kicker: Kicker): CutPiece[] {
  const { height, width, angle } = kicker;
  const { radius, arc, length } = calculateResults(height, angle);
  const struts = calculateStrutPlacements(angle, radius, arc, length);

  // Group struts by section, because their length is the same (ramp width)
  // regardless of where under the arc they sit — the difference is only in
  // whether the full or the reduced section fits. The order matters: strut
  // placements start with the largest section and step down, and preserving
  // that reads sensibly in the printed list.
  const bySection = new Map<number, number>();
  for (const strut of struts) {
    bySection.set(strut.thickness, (bySection.get(strut.thickness) ?? 0) + 1);
  }
  const beams: CutBeam[] = [...bySection.entries()].map(([section, quantity]) => ({
    kind: "beam",
    caption: section === kickerConfig.struts.side ? "Strut" : "Strut (narrow)",
    quantity,
    section,
    length: width,
  }));

  const cheek = cheekBounds(angle, radius);
  const cheekSheet: CutSheet = {
    kind: "sheet",
    caption: "Side cheek",
    quantity: 2,
    thickness: kickerConfig.sides.thickness,
    length: cheek.length,
    width: cheek.height,
    curved: true,
  };

  const deckSheet: CutSheet = {
    kind: "sheet",
    caption: "Riding surface",
    quantity: 1,
    thickness: kickerConfig.surface.thickness,
    length: arc,
    width,
  };

  return [...beams, cheekSheet, deckSheet];
}
