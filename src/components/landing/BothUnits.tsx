import { UNITS, type Unit } from "@/lib/kicker";
import styles from "./landing.module.css";

/**
 * Renders its content once in each unit and lets CSS show the right one.
 *
 * The landing page is a server component and its measurements are baked into
 * the markup, so it cannot re-render when someone flips the toggle in the
 * masthead. The alternatives were to make the whole thing a client component,
 * which would send every illustration's geometry to the browser to change a
 * handful of numbers, or to round-trip to the server for a preference that
 * lives in local storage precisely so it does not need one.
 *
 * Drawing both and hiding one costs a few kilobytes of repeated path data,
 * which compresses to very little, and buys an instant switch with no script
 * involved. The hidden copy is `display: none`, so it is out of the
 * accessibility tree as well as off the screen, which is what lets each
 * illustration keep an `aria-label` written in its own unit.
 *
 * Visibility is scoped by the `data-units` attribute that UnitsScope puts
 * above it.
 */
export function BothUnits({
  as: Wrapper = "span",
  children,
}: {
  /** `div` where the content is a block, such as a whole illustration. */
  as?: "span" | "div";
  children: (units: Unit) => React.ReactNode;
}) {
  return (
    <>
      {UNITS.map((unit) => (
        <Wrapper key={unit} data-unit={unit} className={styles.unitVariant}>
          {children(unit)}
        </Wrapper>
      ))}
    </>
  );
}
