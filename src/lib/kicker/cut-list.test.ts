import { describe, expect, it } from "vitest";
import { kickerConfig } from "./config";
import { calculateCutList } from "./cut-list";
import {
  calculateResults,
  calculateSidePoints,
  calculateStrutPlacements,
  calculateRadius,
} from "./geometry";
import { defaultKicker } from "./types";

const kicker = defaultKicker;

describe("calculateCutList", () => {
  const pieces = calculateCutList(kicker);

  it("lists every strut and both cheeks and the deck", () => {
    const struts = calculateStrutPlacements(
      kicker.angle,
      calculateRadius(kicker.height, kicker.angle),
      calculateResults(kicker.height, kicker.angle).arc,
      calculateResults(kicker.height, kicker.angle).length,
    );
    const beamsTotal = pieces
      .filter((piece) => piece.kind === "beam")
      .reduce((sum, piece) => sum + piece.quantity, 0);
    const sheets = pieces.filter((piece) => piece.kind === "sheet");

    expect(beamsTotal).toBe(struts.length);
    expect(sheets).toHaveLength(2);
    expect(sheets.map((sheet) => sheet.caption)).toEqual(["Side cheek", "Riding surface"]);
  });

  it("puts two cheeks on the ramp, one per side", () => {
    const cheek = pieces.find((piece) => piece.caption === "Side cheek");
    expect(cheek?.quantity).toBe(2);
  });

  it("makes the deck one piece of the same width as the ramp, the arc long", () => {
    const { arc } = calculateResults(kicker.height, kicker.angle);
    const deck = pieces.find((piece) => piece.caption === "Riding surface");

    expect(deck).toMatchObject({
      kind: "sheet",
      quantity: 1,
      thickness: kickerConfig.surface.thickness,
      width: kicker.width,
    });
    if (deck?.kind === "sheet") {
      expect(deck.length).toBeCloseTo(arc, 10);
    }
  });

  it("bounds the cheek by the outline the scene actually extrudes", () => {
    // The side profile starts where the arc first becomes tall enough to draw
    // (sides.minHeight), so its footprint is shorter than the full ramp length
    // by the arc's foot. Reporting the true bounding box means a builder is
    // not buying material for a taper the app does not draw.
    const points = calculateSidePoints(
      kicker.angle,
      calculateRadius(kicker.height, kicker.angle),
    );
    const xs = points.map(([x]) => x);
    const ys = points.map(([, y]) => y);
    const expectedLength = Math.max(...xs) - Math.min(...xs);
    const expectedHeight = Math.max(...ys) - Math.min(...ys);

    const cheek = pieces.find((piece) => piece.caption === "Side cheek");
    expect(cheek).toMatchObject({
      kind: "sheet",
      thickness: kickerConfig.sides.thickness,
      curved: true,
    });
    if (cheek?.kind === "sheet") {
      expect(cheek.length).toBeCloseTo(expectedLength, 10);
      expect(cheek.width).toBeCloseTo(expectedHeight, 10);
      expect(cheek.width).toBeCloseTo(kicker.height, 10);
    }
  });

  it("cuts every strut to the ramp's width", () => {
    for (const piece of pieces) {
      if (piece.kind === "beam") expect(piece.length).toBe(kicker.width);
    }
  });

  it("groups struts by section, with the full section first", () => {
    // A mellow, tall ramp uses both the full and the narrow section.
    const list = calculateCutList({ ...kicker, height: 3, angle: 30 });
    const beams = list.filter((piece) => piece.kind === "beam");

    expect(beams.length).toBe(2);
    expect(beams[0].section).toBe(kickerConfig.struts.side);
    expect(beams[1].section).toBe(kickerConfig.struts.smallSide);
  });

  it("reports one strut group when the small section is not needed", () => {
    // The default kicker only takes the full-size strut.
    const beams = pieces.filter((piece) => piece.kind === "beam");
    expect(beams).toHaveLength(1);
    expect(beams[0].section).toBe(kickerConfig.struts.side);
  });
});
