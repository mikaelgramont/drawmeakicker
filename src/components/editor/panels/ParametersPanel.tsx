"use client";

import { formatAngle, formatLength, parameterRanges } from "@/lib/kicker";
import { selectParametersLocked, useEditorStore } from "@/store/editor-store";
import { Parameter } from "../Parameter";

/** One inch, the natural step once the user is thinking in feet. */
const ONE_INCH = 0.0254;

/** The three inputs that define the ramp. Ported from bihi-params. */
export function ParametersPanel() {
  const { height, width, angle } = useEditorStore((state) => state.kicker);
  const units = useEditorStore((state) => state.units);
  const setParameter = useEditorStore((state) => state.setParameter);
  const locked = useEditorStore(selectParametersLocked);

  const lengthStep = units === "ft" ? ONE_INCH : parameterRanges.height.step;
  const formatAsLength = (value: number) => formatLength(value, units);

  return (
    <>
      <Parameter
        caption="Height"
        value={height}
        min={parameterRanges.height.min}
        max={parameterRanges.height.max}
        step={lengthStep}
        format={formatAsLength}
        disabled={locked}
        onChange={(value) => setParameter("height", value)}
      />
      <Parameter
        caption="Width"
        value={width}
        min={parameterRanges.width.min}
        max={parameterRanges.width.max}
        step={lengthStep}
        format={formatAsLength}
        disabled={locked}
        onChange={(value) => setParameter("width", value)}
      />
      <Parameter
        caption="Exit angle"
        value={angle}
        min={parameterRanges.angle.min}
        max={parameterRanges.angle.max}
        step={parameterRanges.angle.step}
        format={formatAngle}
        disabled={locked}
        onChange={(value) => setParameter("angle", value)}
      />
    </>
  );
}
