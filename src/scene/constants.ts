/** Wood grain, from the ImageList in legacy/public/scripts/imagelist.js. */
export const TEXTURES = {
  side: "/images/textures/wood1_256.jpg",
  slat: "/images/textures/wood2_256.jpg",
  strut: "/images/textures/wood3_256.jpg",
} as const;

export const BOARD_MODEL = "/models/board.glb";
export const ANNOTATION_FONT = "/fonts/archer-medium.otf";

/** The two blueprint colours, matching --color-text and --color-dark-blue. */
export const OUTLINE_COLOR = "#f8faff";
export const GRID_COLOR = "#010845";

/**
 * Edge angle, in degrees, above which an outline is drawn.
 *
 * The original passed `Math.PI` to EdgesHelper, whose threshold argument was
 * in degrees rather than radians, so the effective value was 3.14 degrees.
 * That reads as intentional: the arc is tessellated into 1.5-degree facets, so
 * this hides the tessellation while keeping every real crease. Rounding it to
 * 180 would erase the silhouette entirely.
 */
export const EDGE_THRESHOLD_DEGREES = 3.14;

export const ANNOTATION_TEXT_SIZE = 0.15;
/** How far annotations sit off the thing they measure. */
export const ANNOTATION_DISTANCE = 0.2;
