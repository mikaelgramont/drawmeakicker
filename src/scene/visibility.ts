import type { Kicker } from "@/lib/kicker";

/**
 * What is drawn, for a given set of toggles.
 *
 * The legacy app spread this across four `setMeshVisibilityForDisplay`
 * overrides (part.js, annotation.js, grid.js, board.js), each flipping
 * `.visible` on a 2d/3d mesh pair. Collecting the rules here means the whole
 * truth table is visible at once and testable without a renderer.
 */
export interface SceneVisibility {
  /** Textured timber. Mutually exclusive with the blueprint outline. */
  solid: boolean;
  /** White edge outlines, the blueprint look. */
  outline: boolean;
  /** Thicker outlines read better in the flat 2D view. */
  outlineWidth: number;
  grid: boolean;
  board: boolean;
  annotations: boolean;
  /**
   * The width annotation spans the ramp in Z, so it is meaningless head-on in
   * the 2D view and is the one annotation gated on the 3D camera.
   */
  widthAnnotation: boolean;
}

export function selectVisibility(kicker: Kicker): SceneVisibility {
  const is3d = kicker.repType === "3d";
  const solid = is3d && kicker.textured;

  return {
    solid,
    outline: !solid,
    outlineWidth: is3d ? 1 : 2,
    grid: is3d && kicker.grid,
    board: is3d && kicker.mountainboard,
    annotations: kicker.annotations,
    widthAnnotation: is3d && kicker.annotations,
  };
}
