"use client";

import { useEffect, useMemo } from "react";
import { GridHelper } from "three";
import { GRID_COLOR, OUTLINE_COLOR } from "../constants";

/**
 * One-metre ground grid, for scale in the 3D view.
 *
 * r71's GridHelper(size, step) treated `size` as a half-extent and `step` as
 * the spacing, and colours were set afterwards with setColors. The modern
 * signature is (size, divisions, centreLineColor, gridColor), so the legacy
 * GridHelper(100, 1) becomes 200 units across in 200 divisions.
 */
export function BlueprintGrid({ visible }: { visible: boolean }) {
  const grid = useMemo(() => new GridHelper(200, 200, OUTLINE_COLOR, GRID_COLOR), []);
  useEffect(() => () => grid.dispose(), [grid]);

  return <primitive object={grid} visible={visible} />;
}
