/**
 * Types the dimension labels on the main thread instead of in a worker.
 *
 * The labels are drei `Text`, which is troika underneath, and troika builds its
 * worker by stringifying its own functions and rebuilding them inside a blob.
 * That survives Next's bundler and does not survive this one: the revived
 * function ends up referencing module-scope names the worker has no copy of,
 * so `init` never returns and the first label rejects with "Worker module
 * function was called but `init` did not return a callable function".
 *
 * Which would be a cosmetic problem if the labels were the only casualty, but
 * the throw comes from inside the canvas: React unwinds the whole scene with
 * it, and the window shows an empty blueprint frame with no drawing in it at
 * all. Typesetting a dozen short strings on the main thread is not worth
 * measuring, and it has no serialisation step to get wrong.
 *
 * Only the desktop build needs this. The website's labels are typeset in a
 * worker exactly as before.
 */
import { configureTextBuilder } from "troika-three-text";

export function typesetOnMainThread(): void {
  // Ignored once a font has been requested, so this has to run before the
  // editor mounts rather than from the component that happens to need it.
  configureTextBuilder({ useWorker: false });
}
