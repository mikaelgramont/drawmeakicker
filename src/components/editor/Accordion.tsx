"use client";

import type { ReactNode } from "react";
import type { Step } from "@/store/editor-store";
import styles from "./accordion.module.css";

export interface AccordionStep {
  id: Step;
  caption: string;
  /**
   * The number shown to the user. Save and Share both show 3, since only one
   * of them is ever reachable.
   */
  displayNumber: number;
  content: ReactNode;
}

/**
 * The stepped sidebar, ported from bihi-accordion and bihi-design-step.
 *
 * The original tracked step indices against a NodeList and skipped over
 * elements with a `hidden` class to work out first/last and next/previous.
 * Here the caller passes only the steps that are actually reachable, so
 * navigation is plain array arithmetic.
 */
export function Accordion({
  steps,
  current,
  onSelect,
  className,
}: {
  steps: readonly AccordionStep[];
  current: Step;
  onSelect: (step: Step) => void;
  className?: string;
}) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === current),
  );

  return (
    <div className={`${styles.accordion} ${className ?? ""}`} role="tablist">
      {steps.map((step, index) => {
        const active = index === currentIndex;

        return (
          <section key={step.id} className={styles.step} data-active={active || undefined}>
            <button
              type="button"
              role="tab"
              aria-selected={active}
              className={`${styles.title} inverted size-3`}
              onClick={() => onSelect(step.id)}
            >
              <span>{step.displayNumber}</span> - <span>{step.caption}</span>
            </button>

            {active && (
              <div role="tabpanel" className={styles.body}>
                <div className={styles.content}>{step.content}</div>
                <div className={styles.navigation}>
                  <button
                    type="button"
                    className="deemphasized"
                    hidden={index === 0}
                    onClick={() => onSelect(steps[index - 1].id)}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    hidden={index === steps.length - 1}
                    onClick={() => onSelect(steps[index + 1].id)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

/** The dashed-border grouping used inside each step. */
export function Fieldset({
  legend,
  children,
  className,
}: {
  legend: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${styles.fieldsetWrapper} ${className ?? ""}`}>
      <fieldset className={`${styles.fieldset} dashed-borders`}>
        <legend className="size-3">{legend}</legend>
        {children}
      </fieldset>
    </div>
  );
}
