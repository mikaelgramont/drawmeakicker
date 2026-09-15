import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const resolvePath = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

/**
 * The desktop build.
 *
 * Next builds the website and cannot build this: `/` is a server component that
 * reads the Accept-Language header and queries SQLite to put og: tags on a
 * shared link, and `/api/kickers` is a POST handler, neither of which survives
 * `output: "export"`. Rather than break the website's share links to make it
 * exportable, this compiles the same src/ tree as a plain SPA and Tauri serves
 * the result. The React components are shared, not copied — the only thing in
 * here that resembles application code is the shell in src/.
 */
export default defineConfig({
  root: resolvePath("."),
  plugins: [react()],

  resolve: {
    /*
     * `@react-three/xr` brings its WebXR emulator, which depends on an older
     * three than the app's, and two copies in one page means two sets of
     * classes: a mesh built by one is not `instanceof` the other's Mesh, which
     * breaks raycasting and the loaders in ways that are miserable to trace.
     * Rolldown collapses them for the production bundle on its own; this is
     * what stops the dev server from behaving differently.
     *
     * Safe to force onto one version here because the emulator is unreachable
     * in this build either way — it sits behind a dynamic import that is only
     * taken when `navigator.xr` exists, and neither WKWebView nor WebView2
     * provides it.
     */
    dedupe: ["three"],

    alias: {
      // The same path alias tsconfig.json declares, so shared imports resolve.
      "@": resolvePath("../src"),
      /*
       * App.tsx defers the editor with `next/dynamic`, which is worth keeping
       * on a bundle this size. See the shim for what replaces it.
       */
      "next/dynamic": resolvePath("./src/shims/next-dynamic.tsx"),
    },
  },

  // The website's assets, unchanged and at the same absolute paths the CSS,
  // the GLTF loader and the texture loader already ask for.
  publicDir: resolvePath("../public"),

  // Tauri drives the dev server and expects to find it on a port it was told
  // about, so failing loudly beats silently moving to the next one.
  clearScreen: false,
  server: { port: 1420, strictPort: true },

  // Lets the shell read VITE_ vars, plus the target info Tauri injects.
  envPrefix: ["VITE_", "TAURI_ENV_"],

  build: {
    outDir: resolvePath("./dist"),
    emptyOutDir: true,
    /*
     * The one WebView this has to run in is known at build time, so there is
     * no reason to transpile for any other: WebView2 on Windows is Chromium,
     * and WKWebView on macOS tracks the installed Safari.
     */
    target: process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari13",
    minify: !process.env.TAURI_ENV_DEBUG,
    sourcemap: Boolean(process.env.TAURI_ENV_DEBUG),
  },
});
