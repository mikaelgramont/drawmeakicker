// @ts-check
import { serwist } from "@serwist/next/config";

/*
 * Configurator mode: this only generates the @serwist/cli options, and the
 * worker is built by `serwist build` after `next build`. Building afterwards
 * rather than from inside the bundler is what lets the precache manifest see
 * the prerendered output, which is how /~offline gets into it.
 *
 * The defaults already glob `.next/static/**` and `public/**`, which covers the
 * lazily imported editor chunk along with board.glb, the wood textures and the
 * fonts. Nothing here needs to restate them.
 */
export default serwist({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
});
