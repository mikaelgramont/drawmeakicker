/**
 * The two-page PDF build plan.
 *
 * Page one is a summary — name, id, the six measurements, and the cut list —
 * beside a black-and-white snapshot of the 3D view. Page two is the annotated
 * 2D side view drawn as vector paths inside the notched blueprint frame.
 *
 * jsPDF is imported dynamically so the ~350kB of library plus font
 * definitions does not sit in the editor bundle for every visitor. It is
 * pulled in the moment the Export PDF button is pressed; the browser caches
 * the chunk, so the second export is instant.
 *
 * Nothing in here reaches into React, three.js or the store: it takes a
 * kicker, an optional server id, and a pre-rendered 3D snapshot, and returns
 * PDF bytes as a data URL. That is what lets the same code work in the PWA
 * and in Tauri: the data URL crosses the seam in `src/lib/runtime.ts`, and
 * whatever `saveDataUrl` is configured to do takes it from there.
 */
import {
  calculateCutList,
  calculateResults,
  formatAngle,
  formatLength,
  formatThickness,
  type CutPiece,
  type Kicker,
  type Unit,
} from "@/lib/kicker";
import { FRAME_NOTCH_LENGTH, frameNotches } from "@/lib/drawing/frame";
import { buildSideView, type Primitive } from "./side-view";
import type { ThreeDeeSnapshot } from "./three-dee";

/** Landscape A4 in points, the units jsPDF works in. */
const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;

const MARGIN = 32;

/** Bit of extra room on the frame notches on page two: 6pt reads clearly. */
const PDF_NOTCH_LENGTH = 6;

const TITLE_SIZE = 18;
const HEADING_SIZE = 12;
const BODY_SIZE = 10;
const SMALL_SIZE = 8;

const LINE_MAIN = 0.75;
const LINE_THIN = 0.4;

export interface PdfOptions {
  kicker: Kicker;
  /** The server id, once the design has been saved. Omit for an unsaved draft. */
  savedId: number | null;
  units: Unit;
  snapshot: ThreeDeeSnapshot;
}

export interface PdfResult {
  /** `data:application/pdf;base64,...`, ready to hand to `saveDataUrl`. */
  dataUrl: string;
  /** A safe filename derived from the design's title, or "kicker" if blank. */
  filename: string;
}

/** Slugifies a title to a filename, in the same "kicker" spirit as the PNG. */
function toFilename(kicker: Kicker): string {
  const slug = kicker.title
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  return `${slug || "kicker"}.pdf`;
}

/** The six measurements page one lists, in the order builders read them. */
function measurementRows(kicker: Kicker, unit: Unit): [string, string][] {
  const { length, radius, arc } = calculateResults(kicker.height, kicker.angle);
  return [
    ["Height", formatLength(kicker.height, unit)],
    ["Width", formatLength(kicker.width, unit)],
    ["Exit angle", formatAngle(kicker.angle)],
    ["Base length", formatLength(length, unit)],
    ["Surface length", formatLength(arc, unit)],
    ["Transition radius", formatLength(radius, unit)],
  ];
}

/** Describes a cut list piece for the table on page one. */
function describePiece(piece: CutPiece, unit: Unit): { material: string; dimensions: string } {
  if (piece.kind === "beam") {
    return {
      material: `${formatThickness(piece.section, unit)} timber`,
      dimensions: `${formatLength(piece.length, unit)} long`,
    };
  }
  const dims = `${formatLength(piece.length, unit)} \u00d7 ${formatLength(piece.width, unit)}`;
  return {
    material: `${formatThickness(piece.thickness, unit)} sheet`,
    dimensions: piece.curved ? `${dims} (one curved edge)` : dims,
  };
}

type JsPdf = import("jspdf").jsPDF;

/** Applies a primitive list to a jsPDF, one primitive at a time. */
function drawPrimitives(doc: JsPdf, primitives: readonly Primitive[]): void {
  for (const primitive of primitives) {
    switch (primitive.kind) {
      case "polyline": {
        doc.setLineWidth(primitive.weight === "thin" ? LINE_THIN : LINE_MAIN);
        const points = primitive.points;
        if (points.length < 2) break;
        const [first, ...rest] = points;
        // jsPDF's `lines` takes deltas from a start point, so build a delta
        // list once rather than issuing a `line` call per segment.
        const deltas: number[][] = [];
        let previous = first;
        for (const point of rest) {
          deltas.push([point.x - previous.x, point.y - previous.y]);
          previous = point;
        }
        doc.lines(deltas, first.x, first.y, [1, 1], "S", primitive.closed === true);
        break;
      }
      case "polygon": {
        const points = primitive.points;
        if (points.length < 3) break;
        const [first, ...rest] = points;
        const deltas: number[][] = [];
        let previous = first;
        for (const point of rest) {
          deltas.push([point.x - previous.x, point.y - previous.y]);
          previous = point;
        }
        doc.lines(deltas, first.x, first.y, [1, 1], "F", true);
        break;
      }
      case "text": {
        doc.setFontSize(primitive.size);
        doc.text(primitive.text, primitive.x, primitive.y, {
          align: primitive.align ?? "left",
          baseline: primitive.baseline ?? "alphabetic",
          angle: primitive.rotation ? (-primitive.rotation * 180) / Math.PI : 0,
        });
        break;
      }
    }
  }
}

/** Draws the notched blueprint frame around a rectangle. */
function drawFrame(doc: JsPdf, x: number, y: number, width: number, height: number): void {
  doc.setLineWidth(LINE_MAIN);
  doc.setDrawColor(0);
  doc.rect(x, y, width, height, "S");

  for (const notch of frameNotches(width, height, PDF_NOTCH_LENGTH)) {
    doc.line(x + notch.x1, y + notch.y1, x + notch.x2, y + notch.y2);
  }
}

/**
 * Fits an image into a box, preserving aspect. Returns the position and size
 * the caller has to hand to `addImage`.
 */
function fitInto(
  box: { x: number; y: number; width: number; height: number },
  source: { width: number; height: number },
): { x: number; y: number; width: number; height: number } {
  const sourceAspect = source.width / source.height;
  const boxAspect = box.width / box.height;

  if (sourceAspect > boxAspect) {
    const width = box.width;
    const height = width / sourceAspect;
    return { x: box.x, y: box.y + (box.height - height) / 2, width, height };
  }
  const height = box.height;
  const width = height * sourceAspect;
  return { x: box.x + (box.width - width) / 2, y: box.y, width, height };
}

/** Assembles page one: header, measurements, cut list, 3D snapshot. */
function drawPageOne(
  doc: JsPdf,
  { kicker, savedId, units, snapshot }: PdfOptions,
): void {
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);
  doc.setFillColor(0, 0, 0);

  // Header: title on the left, id on the right.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(TITLE_SIZE);
  doc.text(kicker.title || "Untitled kicker", MARGIN, MARGIN + TITLE_SIZE);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(SMALL_SIZE);
  const idText = savedId !== null ? `Design #${savedId}` : "Unsaved draft";
  doc.text(idText, PAGE_WIDTH - MARGIN, MARGIN + TITLE_SIZE, {
    align: "right",
    baseline: "alphabetic",
  });

  // A rule under the header, to separate it from the two-column body.
  const ruleY = MARGIN + TITLE_SIZE + 8;
  doc.setLineWidth(LINE_MAIN);
  doc.line(MARGIN, ruleY, PAGE_WIDTH - MARGIN, ruleY);

  // Two columns below the rule: text on the left, 3D on the right.
  const contentTop = ruleY + 20;
  const contentBottom = PAGE_HEIGHT - MARGIN;
  const contentHeight = contentBottom - contentTop;
  const gutter = 24;
  const columnWidth = (PAGE_WIDTH - 2 * MARGIN - gutter) / 2;
  const leftX = MARGIN;
  const rightX = MARGIN + columnWidth + gutter;

  // Left column: measurements and cut list, stacked.
  let cursorY = contentTop;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(HEADING_SIZE);
  doc.text("Measurements", leftX, cursorY);
  cursorY += HEADING_SIZE + 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(BODY_SIZE);
  const rowHeight = BODY_SIZE + 6;
  for (const [caption, value] of measurementRows(kicker, units)) {
    doc.text(caption, leftX, cursorY);
    doc.text(value, leftX + columnWidth, cursorY, { align: "right" });
    cursorY += rowHeight;
  }

  cursorY += 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(HEADING_SIZE);
  doc.text("Cut list", leftX, cursorY);
  cursorY += HEADING_SIZE + 6;

  // Cut list header row.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(SMALL_SIZE);
  const qtyX = leftX;
  const captionX = leftX + 30;
  const materialX = leftX + 130;
  const dimensionsX = leftX + columnWidth;
  doc.text("Qty", qtyX, cursorY);
  doc.text("Piece", captionX, cursorY);
  doc.text("Material", materialX, cursorY);
  doc.text("Cut to", dimensionsX, cursorY, { align: "right" });
  cursorY += SMALL_SIZE + 2;
  doc.setLineWidth(LINE_THIN);
  doc.line(leftX, cursorY, leftX + columnWidth, cursorY);
  cursorY += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(BODY_SIZE);
  for (const piece of calculateCutList(kicker)) {
    const { material, dimensions } = describePiece(piece, units);
    doc.text(String(piece.quantity), qtyX, cursorY);
    doc.text(piece.caption, captionX, cursorY);
    doc.text(material, materialX, cursorY);
    doc.text(dimensions, dimensionsX, cursorY, { align: "right" });
    cursorY += rowHeight;
  }

  // Right column: the 3D snapshot, framed and letterboxed.
  const imageBox = {
    x: rightX,
    y: contentTop,
    width: columnWidth,
    height: contentHeight,
  };
  drawFrame(doc, imageBox.x, imageBox.y, imageBox.width, imageBox.height);

  // Fit the snapshot inside the frame with a bit of interior padding.
  const inset = PDF_NOTCH_LENGTH + 4;
  const insetBox = {
    x: imageBox.x + inset,
    y: imageBox.y + inset,
    width: imageBox.width - 2 * inset,
    height: imageBox.height - 2 * inset,
  };
  const placement = fitInto(insetBox, snapshot);
  doc.addImage(
    snapshot.dataUrl,
    "PNG",
    placement.x,
    placement.y,
    placement.width,
    placement.height,
  );
}

/** Assembles page two: the vector side view inside the blueprint frame. */
function drawPageTwo(doc: JsPdf, { kicker, units, savedId }: PdfOptions): void {
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);
  doc.setFillColor(0, 0, 0);

  const frameX = MARGIN;
  const frameY = MARGIN;
  const frameWidth = PAGE_WIDTH - 2 * MARGIN;
  const frameHeight = PAGE_HEIGHT - 2 * MARGIN;
  drawFrame(doc, frameX, frameY, frameWidth, frameHeight);

  // Title-block strip along the bottom inside the frame: the design's name on
  // the left and the id on the right, so a printed page still identifies
  // itself once it is off screen.
  const titleStripHeight = 24;
  const titleStripY = frameY + frameHeight - titleStripHeight;
  doc.setLineWidth(LINE_MAIN);
  doc.line(frameX, titleStripY, frameX + frameWidth, titleStripY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(BODY_SIZE);
  doc.text(kicker.title || "Untitled kicker", frameX + PDF_NOTCH_LENGTH + 4, titleStripY + 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(SMALL_SIZE);
  const idText = savedId !== null ? `Design #${savedId}` : "Unsaved draft";
  doc.text(idText, frameX + frameWidth - PDF_NOTCH_LENGTH - 4, titleStripY + 15, {
    align: "right",
  });

  // The drawing itself sits above the strip, offset a little inside the frame
  // so the polylines do not brush against the border.
  const inset = PDF_NOTCH_LENGTH + 4;
  const canvasWidth = frameWidth - 2 * inset;
  const canvasHeight = titleStripY - frameY - 2 * inset;

  const primitives = buildSideView(kicker, { width: canvasWidth, height: canvasHeight }, units);

  // Translate so the side view's origin lines up with the top-left of the
  // drawing area. jsPDF has no group transform, so shift the coordinates
  // themselves as they go through.
  const shifted: Primitive[] = primitives.map((primitive) => {
    switch (primitive.kind) {
      case "polyline":
        return {
          ...primitive,
          points: primitive.points.map((p) => ({
            x: p.x + frameX + inset,
            y: p.y + frameY + inset,
          })),
        };
      case "polygon":
        return {
          ...primitive,
          points: primitive.points.map((p) => ({
            x: p.x + frameX + inset,
            y: p.y + frameY + inset,
          })),
        };
      case "text":
        return {
          ...primitive,
          x: primitive.x + frameX + inset,
          y: primitive.y + frameY + inset,
        };
    }
  });

  doc.setFont("helvetica", "normal");
  drawPrimitives(doc, shifted);
}

/**
 * Builds the PDF and returns it as a data URL together with the filename to
 * save it under. Lazily imports jsPDF, so this function is the first thing
 * that pays for it.
 */
export async function buildPdf(options: PdfOptions): Promise<PdfResult> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  drawPageOne(doc, options);
  doc.addPage("a4", "landscape");
  drawPageTwo(doc, options);

  const dataUrl = doc.output("datauristring");
  return { dataUrl, filename: toFilename(options.kicker) };
}
