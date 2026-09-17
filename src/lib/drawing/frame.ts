/**
 * The blueprint frame: a rectangular border with tick marks dividing each edge
 * into quarters, ported from the legacy `BlueprintBorderRenderer`.
 *
 * The geometry is decoupled from the canvas it is painted onto so the PDF
 * export can trace exactly the same frame at print resolution. The three
 * consumers (`components/renderer/BlueprintBorder` on screen, the on-screen
 * PNG export via `composeExport`, and the PDF export's page-two frame) all
 * ask this module the same question — where are the notches — and answer it
 * with whatever drawing primitives they have.
 */

/** Notches divide each edge into `ROWS`/`COLUMNS` equal parts. */
export const FRAME_ROWS = 4;
export const FRAME_COLUMNS = 4;

/**
 * How far a notch reaches into the frame, in the same units the caller uses
 * for the outer rectangle. Kept fixed rather than proportional so the frame
 * reads the same at every drawing size.
 */
export const FRAME_NOTCH_LENGTH = 10;

/** One notch as a pair of endpoints, in the caller's units. */
export interface FrameNotch {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Every notch that makes up the frame, given the outer rectangle's dimensions.
 *
 * The spacing formula matches the original: reserve a pixel of padding around
 * the frame and one at every internal column boundary, so a 1px stroke lands
 * on the intended coordinate rather than straddling two.
 *
 * `notchLength` defaults to the on-screen length. The PDF passes its own,
 * because 10 user units on an A4 page is a good deal shorter than 10 pixels.
 */
export function frameNotches(
  width: number,
  height: number,
  notchLength = FRAME_NOTCH_LENGTH,
): FrameNotch[] {
  const notches: FrameNotch[] = [];

  const columnSpacing = (width - (FRAME_COLUMNS - 1) - 2) / FRAME_COLUMNS;
  for (let i = 1; i < FRAME_COLUMNS; i++) {
    const x = columnSpacing * i;
    notches.push({ x1: x, y1: 0, x2: x, y2: notchLength });
    notches.push({ x1: x, y1: height, x2: x, y2: height - notchLength });
  }

  const rowSpacing = (height - (FRAME_ROWS - 1) - 2) / FRAME_ROWS;
  for (let i = 1; i < FRAME_ROWS; i++) {
    const y = rowSpacing * i;
    notches.push({ x1: 0, y1: y, x2: notchLength, y2: y });
    notches.push({ x1: width, y1: y, x2: width - notchLength, y2: y });
  }

  return notches;
}
