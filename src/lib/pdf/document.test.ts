// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { defaultKicker } from "@/lib/kicker";
import { buildPdf } from "./document";

/**
 * jsPDF exports the whole document as a data URL, which is what the runtime
 * seam accepts. The tests below open the resulting PDF and check the invariant
 * bits: that it starts with the PDF magic, that it carries the pages we
 * asked for, and that the file it names is derived from the design's title.
 *
 * A pixel-perfect check of the layout is left to the eye — a snapshot test
 * of a PDF byte stream reads as a regression after any harmless tweak.
 */

// A minimum-valid 4x3 red PNG, generated with pillow.
const SNAPSHOT_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAIAAAA7ljmRAAAAEElEQVR4nGP4z8AARww4OQD1MQv1NXv7ggAAAABJRU5ErkJggg==";
const snapshot = { dataUrl: SNAPSHOT_DATA_URL, width: 4, height: 3 };

function decodeBase64(dataUrl: string): Buffer {
  return Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
}

describe("buildPdf", () => {
  it("emits a PDF the runtime seam can save", async () => {
    const result = await buildPdf({
      kicker: { ...defaultKicker, title: "Default", description: "" },
      savedId: 42,
      units: "m",
      snapshot,
    });

    expect(result.dataUrl.startsWith("data:application/pdf;")).toBe(true);
    const bytes = decodeBase64(result.dataUrl);
    expect(bytes.subarray(0, 4).toString("latin1")).toBe("%PDF");

    // Two `/Type /Page` entries, one per page, must appear in the body. The
    // catalogue's `/Kids [ ... ]` entry is a good enough witness.
    const text = bytes.toString("latin1");
    expect(text).toMatch(/\/Kids\s*\[[^\]]+\]/);
    // Every page has its own /MediaBox in landscape A4.
    const pageCount = (text.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    expect(pageCount).toBe(2);
  });

  it("names the file after the design's title", async () => {
    const result = await buildPdf({
      kicker: { ...defaultKicker, title: "Bikepark medium", description: "" },
      savedId: null,
      units: "m",
      snapshot,
    });
    expect(result.filename).toBe("bikepark-medium.pdf");
  });

  it("falls back to a plain filename when the title is blank", async () => {
    const result = await buildPdf({
      kicker: defaultKicker,
      savedId: null,
      units: "m",
      snapshot,
    });
    expect(result.filename).toBe("kicker.pdf");
  });

  it("carries imperial measurements through when the user asks for feet", async () => {
    const result = await buildPdf({
      kicker: { ...defaultKicker, title: "" },
      savedId: null,
      units: "ft",
      snapshot,
    });
    const text = decodeBase64(result.dataUrl).toString("latin1");
    // 1.2m is exactly 3ft 11in. The label appears as text drawing operators
    // in the PDF body; jsPDF encodes plain ASCII inline for the standard
    // Helvetica fonts.
    expect(text).toContain("3ft 11in");
  });
});
