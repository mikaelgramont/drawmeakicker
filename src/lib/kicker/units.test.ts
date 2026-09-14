import { describe, expect, it } from "vitest";
import { formatAngle, formatLength, metersToFeetAndInches } from "./units";

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

describe("formatAngle", () => {
  it("rounds to whole degrees", () => {
    expect(formatAngle(45)).toBe("45\u00b0");
    expect(formatAngle(89.9)).toBe("90\u00b0");
  });
});
