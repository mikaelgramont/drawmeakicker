"use client";

import { useEffect, useState } from "react";
import { createXRStore } from "@react-three/xr";

/**
 * The XR session store.
 *
 * Replaces the legacy VR stack wholesale: THREE.StereoEffect,
 * DeviceOrientationControls and VREffect were all removed from three years
 * ago. WebXR handles stereo rendering, head tracking and entering fullscreen
 * itself, so the hand-rolled eye separation and fullscreen plumbing in
 * renderer3d.js and bihi-representation.html are gone.
 */
export const xrStore = createXRStore();

/**
 * Whether the device can show an immersive VR session.
 *
 * The original guessed from the user agent (legacy/php/mobiledetector.php);
 * asking the browser is both accurate and cheaper.
 */
export function useVrSupported(): boolean {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    let cancelled = false;
    navigator.xr
      ?.isSessionSupported("immersive-vr")
      .then((result) => {
        if (!cancelled) setSupported(result);
      })
      .catch(() => {
        if (!cancelled) setSupported(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return supported;
}
