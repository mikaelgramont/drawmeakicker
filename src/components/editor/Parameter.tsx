"use client";

import { useId } from "react";
import styles from "./parameter.module.css";

/**
 * A labelled slider with nudge buttons, ported from bihi-design-parameter.
 *
 * Values always snap to a whole number of steps from the minimum, so dragging
 * in imperial mode lands on whole inches. The original rounded to two decimals
 * instead, which quantised a one-inch step (0.0254m) to 0.03m.
 */
export function Parameter({
  caption,
  value,
  min,
  max,
  step,
  format,
  disabled = false,
  onChange,
}: {
  caption: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const id = useId();

  const snap = (candidate: number) => {
    const steps = Math.round((candidate - min) / step);
    return Math.min(max, Math.max(min, min + steps * step));
  };

  return (
    <div className={styles.parameter}>
      <label htmlFor={id} className={`${styles.caption} size-2`}>
        <span>{caption}</span>: <span>{format(value)}</span>
      </label>
      <div className={styles.controls}>
        <button
          type="button"
          className={`${styles.step} small`}
          aria-label={`decrease ${caption}`}
          hidden={disabled}
          onClick={() => onChange(snap(value - step))}
        >
          &minus;
        </button>
        <input
          id={id}
          type="range"
          className={styles.slider}
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(snap(event.target.valueAsNumber))}
        />
        <button
          type="button"
          className={`${styles.step} small`}
          aria-label={`increase ${caption}`}
          hidden={disabled}
          onClick={() => onChange(snap(value + step))}
        >
          +
        </button>
      </div>
    </div>
  );
}
