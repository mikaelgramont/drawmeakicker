/** Ported from legacy/public/scripts/config.js. All lengths in meters. */
export const kickerConfig = {
  sides: {
    steps: 30,
    thickness: 0.03,
    extraLength: 0.1,
    minHeight: 0.015,
  },
  slats: {
    defaultLength: 0.015,
    thickness: 0.015,
    space: 0.01,
  },
  struts: {
    side: 0.08,
    smallSide: 0.04,
    maximumDistance: 0.3,
  },
  surface: {
    thickness: 0.015,
  },
} as const;

export type KickerConfig = typeof kickerConfig;

/** Slider bounds, taken from the bihi-params element's markup. */
export const parameterRanges = {
  height: { min: 0.5, max: 3, step: 0.1 },
  width: { min: 0.5, max: 4, step: 0.1 },
  angle: { min: 30, max: 89.9, step: 1 },
} as const;
