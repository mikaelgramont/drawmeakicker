import type { Kicker } from "@/lib/kicker";
import { OG_DESCRIPTION, SITE_TITLE } from "@/lib/site";

/** The two networks the legacy bihi-share element offered. */
export interface ShareLinks {
  twitterUrl: string;
  facebookUrl: string;
}

export interface OpenGraphData {
  title: string;
  description: string;
  url: string;
  image: string;
}

/** Relative to the site root, as in the legacy DEFAULT_OG_IMAGE constant. */
const DEFAULT_OG_IMAGE = "images/default-kicker.png";

/**
 * Trailing slashes are dropped wherever an origin is used rather than only in
 * `siteUrl`, because `SITE_URL` is the kind of setting that arrives with one
 * and `https://example.com//?id=1` is a different URL to a crawler.
 */
function origin(value: string): string {
  return value.replace(/\/+$/, "");
}

/**
 * The public origin, used to build absolute share and og:url links.
 *
 * Server-side only: `SITE_URL` is not a NEXT_PUBLIC_ variable, so it is not
 * inlined into the client bundle. Everything that needs an absolute URL either
 * renders on the server or receives it from the save response.
 */
export function siteUrl(): string {
  return origin(process.env.SITE_URL || "http://drawmeakicker.com");
}

/** The canonical, shareable address of a saved kicker. */
export function kickerUrl(id: number, site: string = siteUrl()): string {
  return `${origin(site)}/?id=${id}`;
}

/**
 * Ported from OpenGraph::getKickerData in legacy/php/opengraph.php. An
 * untitled kicker falls back to the site's own title and description, and a
 * described one prepends its description to the site's.
 *
 * The original used a '%' placeholder in og:url because index.php had to emit
 * the tags before the id existed; here the id is known per request.
 */
export function openGraphData(
  kicker: Pick<Kicker, "title" | "description">,
  id: number | null,
  site: string = siteUrl(),
): OpenGraphData {
  const root = origin(site);

  return {
    title: kicker.title || SITE_TITLE,
    description: kicker.description
      ? `${kicker.description} - ${OG_DESCRIPTION}`
      : OG_DESCRIPTION,
    url: id === null ? `${root}/` : kickerUrl(id, root),
    image: `${root}/${DEFAULT_OG_IMAGE}`,
  };
}

/**
 * Tags the shared URL with the network it went out on. The legacy version
 * concatenated "&utm=..." onto a URL it knew carried an `?id=`; going through
 * URL keeps it correct for one that does not.
 */
function withUtm(url: string, network: string): string {
  const target = new URL(url);
  target.searchParams.set("utm", network);
  return target.toString();
}

/**
 * Ported from Share in legacy/php/share.php. Twitter gets a caption built from
 * the title and description; Facebook takes the URL alone and reads the rest
 * off the og: tags.
 */
export function shareLinks(og: OpenGraphData): ShareLinks {
  const text = [og.title, og.description].filter(Boolean).join(" - ");

  return {
    twitterUrl:
      "https://twitter.com/intent/tweet" +
      `?url=${encodeURIComponent(withUtm(og.url, "twitter"))}` +
      `&text=${encodeURIComponent(text)}`,
    facebookUrl:
      "https://www.facebook.com/sharer.php" +
      `?u=${encodeURIComponent(withUtm(og.url, "facebook"))}`,
  };
}

/** The share links for a kicker that has just been saved or loaded. */
export function kickerShareLinks(
  kicker: Pick<Kicker, "title" | "description">,
  id: number,
  site: string = siteUrl(),
): ShareLinks {
  return shareLinks(openGraphData(kicker, id, site));
}
