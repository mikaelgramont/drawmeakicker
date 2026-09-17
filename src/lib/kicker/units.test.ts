import { describe, expect, it } from "vitest";
import {
  formatAngle,
  formatLength,
  formatThickness,
  metersToFeetAndInches,
  unitsForLanguage,
} from "./units";

describe("metersToFeetAndInches", () => {
  it("converts exact feet without an inches part", () => {
    expect(metersToFeetAndInches(0.3048)).toBe("1ft");
    expect(metersToFeetAndInches(0.9144)).toBe("3ft");
  });

  it("converts the default kicker height", () => {
    expect(metersToFeetAndInches(1.2)).toBe("3ft 11in");
  });

  it("rolls 12 inches over into the next foot", () => {
    // 0.607m is a hair under 2ft; it must not render as "1ft 12in".
    expect(metersToFeetAndInches(0.6069)).toBe("2ft");
  });

  it("never reports twelve or more inches across the slider range", () => {
    for (let meters = 0; meters <= 4; meters += 0.001) {
      const match = /(\d+)in/.exec(metersToFeetAndInches(meters));
      if (match) expect(Number(match[1])).toBeLessThan(12);
    }
  });

  it("increases monotonically", () => {
    const toInches = (meters: number) => {
      const [, feet, inches] = /(\d+)ft(?: (\d+)in)?/.exec(metersToFeetAndInches(meters))!;
      return Number(feet) * 12 + Number(inches ?? 0);
    };
    let previous = -1;
    for (let meters = 0; meters <= 4; meters += 0.01) {
      const current = toInches(meters);
      expect(current).toBeGreaterThanOrEqual(previous);
      previous = current;
    }
  });
});

describe("formatLength", () => {
  it("shows two decimals in meters", () => {
    expect(formatLength(1.2, "m")).toBe("1.20m");
    expect(formatLength(3.0968749, "m")).toBe("3.10m");
  });

  it("switches to feet and inches", () => {
    expect(formatLength(1.2, "ft")).toBe("3ft 11in");
  });
});

describe("formatThickness", () => {
  it("shows metric to the nearest millimetre", () => {
    expect(formatThickness(0.03, "m")).toBe("30mm");
    expect(formatThickness(0.015, "m")).toBe("15mm");
    expect(formatThickness(0.08, "m")).toBe("80mm");
    expect(formatThickness(0.04, "m")).toBe("40mm");
  });

  /*
   * Plywood and framing timber are sold in fractional inches, so rounding to
   * whole inches (as formatLength does) would report 15mm and 30mm sheets as
   * the same thickness. Sixteenths are the finest gradation a tape measure
   * meaningfully carries and match how the material is priced.
   */
  it("rounds imperial to the nearest sixteenth of an inch", () => {
    expect(formatThickness(0.03, "ft")).toBe("1-3/16in");
    expect(formatThickness(0.015, "ft")).toBe("9/16in");
    expect(formatThickness(0.08, "ft")).toBe("3-1/8in");
    expect(formatThickness(0.04, "ft")).toBe("1-9/16in");
  });

  it("reduces even fractions to their lowest terms", () => {
    // A hair over 1.5in is 1-8/16 which must not print as such.
    expect(formatThickness(0.0381, "ft")).toBe("1-1/2in");
  });

  it("drops the fraction on whole-inch thicknesses", () => {
    expect(formatThickness(0.0254, "ft")).toBe("1in");
    expect(formatThickness(0.0508, "ft")).toBe("2in");
  });
});

describe("formatAngle", () => {
  it("rounds to whole degrees", () => {
    expect(formatAngle(45)).toBe("45\u00b0");
    expect(formatAngle(89.9)).toBe("90\u00b0");
  });
});

describe("unitsForLanguage", () => {
  it("starts US visitors in feet", () => {
    expect(unitsForLanguage("en-US,en;q=0.9")).toBe("ft");
    expect(unitsForLanguage("en-US")).toBe("ft");
    expect(unitsForLanguage("en-US;q=0.9")).toBe("ft");
    expect(unitsForLanguage("en-us")).toBe("ft");
  });

  it("starts everyone else in meters", () => {
    expect(unitsForLanguage("fr-FR,fr;q=0.9")).toBe("m");
    expect(unitsForLanguage("en-GB")).toBe("m");
    expect(unitsForLanguage("en-CH")).toBe("m");
  });

  /*
   * The legacy check gave feet to Canada as well. It is metric, and the tag
   * has to match in full, so neither it nor a US variant tag qualifies.
   */
  it("wants the tag to be en-US and nothing else", () => {
    expect(unitsForLanguage("en-CA")).toBe("m");
    expect(unitsForLanguage("en-US-POSIX")).toBe("m");
    expect(unitsForLanguage("en")).toBe("m");
  });

  it("only looks at the visitor's first preference", () => {
    // Matches the legacy prefix check: en-US further down the list loses.
    expect(unitsForLanguage("fr-FR,en-US;q=0.8")).toBe("m");
  });

  it("defaults to meters without a header", () => {
    expect(unitsForLanguage(null)).toBe("m");
    expect(unitsForLanguage("")).toBe("m");
    expect(unitsForLanguage("  ")).toBe("m");
  });
});
