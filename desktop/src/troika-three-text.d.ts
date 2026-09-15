/**
 * troika-three-text ships no type declarations, and `desktop/src/text-rendering.ts`
 * needs exactly one function from it.
 *
 * Declared member by member rather than as a bare `declare module`, which would
 * type the whole module as `any`. Nothing else in the app imports this path
 * directly — drei wraps it and brings its own types — so the narrow version
 * costs nothing and keeps a typo in the config object an error.
 */
declare module "troika-three-text" {
  export function configureTextBuilder(config: {
    useWorker?: boolean;
    sdfGlyphSize?: number;
    unicodeFontsURL?: string;
  }): void;
}
