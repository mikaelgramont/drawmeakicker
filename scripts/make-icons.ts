/**
 * Generates the PWA icons in public/icons from the app's own geometry.
 *
 * The icon is the default kicker's side profile, the same outline
 * calculateSidePoints feeds to the plywood cheeks in the scene, drawn in the
 * blueprint palette. Deriving it rather than drawing it by hand means the icon
 * cannot drift away from what the app actually produces.
 *
 * Every size is full-bleed so one image can serve as both a plain and a
 * maskable icon: the background covers the whole square, and the drawing is
 * fitted inside the central circle that the maskable spec guarantees will
 * survive whatever shape a launcher crops to.
 *
 * Needs rsvg-convert (brew install librsvg). The PNGs are committed, so this
 * only has to run when the palette or the default kicker changes.
 *
 * Run with: pnpm assets:icons
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { calculateRadius, calculateSidePoints, defaultKicker } from "../src/lib/kicker/index";

const DESTINATION = resolve("public/icons");
const CANVAS = 512;

/** --color-light-blue and --color-text from src/styles/global.css. */
const PAPER = "#3b69d5";
const INK = "#f8faff";

/**
 * The maskable safe zone: a circle of 40% of the canvas width, centred. Art
 * outside it may be cropped away, so the whole profile has to fit within.
 */
const SAFE_RADIUS = CANVAS * 0.4;

const SIZES = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  // iOS does its own rounding and never masks, but it also never supplies a
  // background, which is why this one is full-bleed too.
  { file: "apple-touch-icon.png", size: 180 },
];

const profile = calculateSidePoints(
  defaultKicker.angle,
  calculateRadius(defaultKicker.height, defaultKicker.angle),
);

const xs = profile.map(([x]) => x);
const ys = profile.map(([, y]) => y);
const minX = Math.min(...xs);
const minY = Math.min(...ys);
const width = Math.max(...xs) - minX;
const height = Math.max(...ys) - minY;

/*
 * Fit the outline's bounding box inside the safe circle by matching its
 * half-diagonal to the radius, so a change to the default height or angle
 * rescales the drawing instead of pushing it out of the safe zone.
 */
const scale = (2 * SAFE_RADIUS) / Math.hypot(width, height);
const originX = (CANVAS - width * scale) / 2 - minX * scale;
// The model has y pointing up from the ground; SVG has it pointing down.
const groundY = (CANVAS + height * scale) / 2 + minY * scale;

const points = profile
  .map(([x, y]) => `${(originX + x * scale).toFixed(2)},${(groundY - y * scale).toFixed(2)}`)
  .join(" ");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">
  <rect width="${CANVAS}" height="${CANVAS}" fill="${PAPER}"/>
  <polygon points="${points}" fill="${INK}"/>
</svg>
`;

mkdirSync(DESTINATION, { recursive: true });

const source = resolve(DESTINATION, "icon.svg");
writeFileSync(source, svg);

for (const { file, size } of SIZES) {
  const out = resolve(DESTINATION, file);
  execFileSync("rsvg-convert", ["-w", String(size), "-h", String(size), "-o", out, source]);
  console.log(`Wrote ${out} (${size}x${size})`);
}
