/**
 * One-time asset conversion: legacy/public/models/board.dae -> public/models/board.glb
 *
 * The legacy app shipped three's ColladaLoader to the browser just for this one
 * mountainboard model. Converting it once means the app loads a compact binary
 * glTF via useGLTF and no loader ends up in the bundle.
 *
 * Run with: pnpm tsx scripts/dae-to-glb.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { JSDOM } from "jsdom";

const SOURCE = resolve("legacy/public/models/board.dae");
const DESTINATION = resolve("public/models/board.glb");

// three's ColladaLoader parses XML with DOMParser and walks it with the DOM API;
// GLTFExporter needs a few globals too. Install them before importing either.
const dom = new JSDOM("<!doctype html><html><body></body></html>");
const globals = {
  window: dom.window,
  document: dom.window.document,
  DOMParser: dom.window.DOMParser,
  XMLSerializer: dom.window.XMLSerializer,
  Node: dom.window.Node,
  self: dom.window,
  // GLB output round-trips the binary chunk through a Blob and a FileReader.
  // Both must come from jsdom so the reader recognises the blob.
  Blob: dom.window.Blob,
  FileReader: dom.window.FileReader,
} as const;
for (const [key, value] of Object.entries(globals)) {
  Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
}

const { ColladaLoader } = await import("three/examples/jsm/loaders/ColladaLoader.js");
const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");

// board.dae is Z_UP. The loader rotates the scene root to bring it to Y-UP,
// which is what the legacy `convertUpAxis: true` option did. That rotation is
// baked into the GLB root node, so consumers must place the model with a
// wrapper group rather than by setting rotation on the loaded scene itself.
const loader = new ColladaLoader();
const collada = loader.parse(readFileSync(SOURCE, "utf8"), "");
if (!collada) throw new Error(`Could not parse ${SOURCE}`);

const exporter = new GLTFExporter();
const glb = (await exporter.parseAsync(collada.scene, { binary: true })) as ArrayBuffer;

mkdirSync(dirname(DESTINATION), { recursive: true });
writeFileSync(DESTINATION, Buffer.from(glb));

let meshes = 0;
collada.scene.traverse((node) => {
  if ((node as { isMesh?: boolean }).isMesh) meshes += 1;
});
console.log(`Wrote ${DESTINATION} (${meshes} meshes, ${(glb.byteLength / 1024).toFixed(1)} KiB)`);
