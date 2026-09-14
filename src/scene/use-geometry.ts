import { useEffect, useMemo, type DependencyList } from "react";
import type { BufferGeometry } from "three";

/**
 * Memoizes a geometry and disposes the previous one when it is replaced.
 *
 * Every parameter change rebuilds the profile, so without the dispose the
 * editor would leak a buffer per slider tick.
 */
export function useGeometry<T extends BufferGeometry>(
  factory: () => T,
  deps: DependencyList,
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const geometry = useMemo(factory, deps);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}
