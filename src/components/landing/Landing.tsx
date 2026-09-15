/**
 * The pitch above the editor.
 *
 * A server component, and deliberately: the illustrations are generated from
 * the geometry library (./KickerDiagram) and the only thing here that needs to
 * run in the browser is the button. So the drawings arrive as markup, cost no
 * script, and are in the HTML a crawler sees.
 *
 * Every figure in the copy is read from the app rather than typed in, so the
 * page cannot end up promising a range the sliders do not have.
 */
import { defaultKicker, formatAngle, formatLength, parameterRanges, type Unit } from "@/lib/kicker";
import { VIDEO_ID } from "@/lib/site";
import {
  defaultStrutCount,
  HeroDiagram,
  MeasurementsDiagram,
  RangeDiagram,
  StrutsDiagram,
} from "./KickerDiagram";
import styles from "./landing.module.css";
import { StartButton } from "./StartButton";

export function Landing({ units }: { units: Unit }) {
  const shortest = formatLength(parameterRanges.height.min, units);
  const tallest = formatLength(parameterRanges.height.max, units);
  const struts = defaultStrutCount();

  return (
    <div className={styles.landing}>
      <section className={styles.hero}>
        <div>
          <p className={styles.tag}>Kickers, jumps, ramps</p>
          <h2 className={styles.heroTitle}>
            Ramp design <span>the easy way.</span>
          </h2>
          <p className={styles.heroLead}>
            You already know how tall you want it and how steep you want the lip. We work out
            the curve that gets you there, every measurement you need to cut, and the frame
            that holds it up.
          </p>
          <div className={styles.heroActions}>
            <StartButton />
            <p className={styles.heroNote}>No account. Works offline.</p>
          </div>
        </div>

        <figure className={styles.heroFigure}>
          <HeroDiagram
            height={defaultKicker.height}
            angle={defaultKicker.angle}
            units={units}
          />
          <figcaption className={styles.figureCaption}>
            A {formatLength(defaultKicker.height, units)} kicker with a{" "}
            {formatAngle(defaultKicker.angle)} lip. Drawn, like every illustration here, by the
            same code that draws it in the editor.
          </figcaption>
        </figure>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeadSplit}>
          <div>
            <h3 className={styles.sectionTitle}>How it works</h3>
            <p className={styles.sectionLead}>
              Three numbers go in. A drawing, a full set of measurements and a cutting plan come
              out.
            </p>
          </div>
          <figure className={styles.sketchFigure}>
            <img
              className={styles.sketch}
              src="/images/header.jpg"
              alt="A kicker drawn by hand on a sheet of paper in marker pen, with its height and length written beside it, next to a hammer, a spirit level and a tape measure."
              width={1024}
              height={576}
            />
            <figcaption className={styles.figureCaption}>Where most kickers start.</figcaption>
          </figure>
        </div>

        <ol className={styles.steps}>
          <li className={styles.step}>
            <figure className={styles.stepFigure}>
              <RangeDiagram units={units} />
            </figure>
            <p className={styles.stepNumber}>Step one</p>
            <h4 className={styles.stepTitle}>Pick the size</h4>
            <p className={styles.stepBody}>
              Drag the height, the width and the exit angle. Anything from {shortest} to{" "}
              {tallest} tall, and from {formatAngle(parameterRanges.angle.min)} up to nearly
              vertical.
            </p>
          </li>

          <li className={styles.step}>
            <figure className={styles.stepFigure}>
              <MeasurementsDiagram units={units} />
            </figure>
            <p className={styles.stepNumber}>Step two</p>
            <h4 className={styles.stepTitle}>Read the numbers</h4>
            <p className={styles.stepBody}>
              The transition radius, the base length and the length of surface to cut, all
              recomputed as you drag. In metres or in feet and inches, whichever you think in.
            </p>
          </li>

          <li className={styles.step}>
            <figure className={styles.stepFigure}>
              <StrutsDiagram units={units} />
            </figure>
            <p className={styles.stepNumber}>Step three</p>
            <h4 className={styles.stepTitle}>See the frame</h4>
            <p className={styles.stepBody}>
              Struts are spaced and sized for you — {struts} of them for the kicker above — so
              you know what timber to buy before you start cutting.
            </p>
          </li>
        </ol>
      </section>

      <section className={styles.section}>
        <div className={styles.split}>
          <div>
            <h3 className={styles.sectionTitle}>See it before you cut anything</h3>
            <p className={styles.sectionLead}>
              Flip between the flat blueprint and a textured 3D model. Orbit around it, stand a
              rider and a mountainboard next to it to check the scale, and if you have a headset,
              walk up to it at full size.
            </p>
          </div>
          {VIDEO_ID ? (
            <div className={styles.videoFrame}>
              <iframe
                src={`https://www.youtube.com/embed/${VIDEO_ID}`}
                title="Draw me a kicker"
                allowFullScreen
              />
            </div>
          ) : null}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>Yours to keep</h3>
          <p className={styles.sectionLead}>
            A design you spent an afternoon on should not depend on a signal or on us.
          </p>
        </div>

        <div className={styles.features}>
          <div className={styles.feature}>
            <h4 className={styles.featureTitle}>Works with no signal</h4>
            <p className={styles.featureBody}>
              The hill and the shed rarely have reception. Designs are saved on your device
              first and go up to the server whenever there is a connection.
            </p>
          </div>
          <div className={styles.feature}>
            <h4 className={styles.featureTitle}>Share a link</h4>
            <p className={styles.featureBody}>
              Every saved design gets its own link, with a preview picture, ready to paste
              wherever you are talking your friends into helping.
            </p>
          </div>
          <div className={styles.feature}>
            <h4 className={styles.featureTitle}>Take the drawing</h4>
            <p className={styles.featureBody}>
              Export the view as a PNG, with or without the blueprint background, and print it
              or put it on your phone for the build.
            </p>
          </div>
          <div className={styles.feature}>
            <h4 className={styles.featureTitle}>Install it</h4>
            <p className={styles.featureBody}>
              Add it to your home screen and it opens like any other app, with everything you
              have designed already in it.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.closing}>
        <h3 className={styles.closingTitle}>How big are you going?</h3>
        <StartButton>Draw me a kicker</StartButton>
      </section>
    </div>
  );
}
