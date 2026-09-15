import type { MetadataRoute } from "next";
import { OG_DESCRIPTION, SITE_TITLE } from "@/lib/site";

/** --color-light-blue from src/styles/global.css, the blueprint paper colour. */
const PAPER = "#3b69d5";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: SITE_TITLE,
    // What fits under a launcher icon; the full title is too long for one.
    short_name: "Kicker",
    description: OG_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: PAPER,
    theme_color: PAPER,
    /*
     * The maskable entry reuses the same file rather than pointing at a variant:
     * scripts/make-icons.ts draws every size full-bleed with the profile inside
     * the maskable safe zone, so there is nothing a separate one would do
     * differently. The spec would allow `purpose: "any maskable"` on a single
     * entry, but Next's type only takes one value at a time.
     */
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
