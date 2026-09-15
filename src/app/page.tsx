import type { Metadata } from "next";
import { headers } from "next/headers";
import { cache } from "react";
import { App } from "@/components/App";
import { Landing } from "@/components/landing/Landing";
import { loadKickerById, parseKickerId, type SavedKicker } from "@/db/kickers";
import { unitsForLanguage } from "@/lib/kicker";
import { kickerShareLinks, openGraphData } from "@/lib/share";
import { SITE_TITLE } from "@/lib/site";
import type { EditorInit } from "@/store/editor-store";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** The message legacy/public/index.php showed when the database was down. */
const DATABASE_ERROR = "We are having database issues. Sorry for the inconvenience.";

/**
 * A stale link. The legacy app let the NotFoundKickerException escape and
 * returned a 500; showing the default kicker with an explanation is both
 * friendlier and what the alert element was there for.
 */
const NOT_FOUND = "We could not find that kicker. Here is a fresh one to start from.";

interface RequestedKicker {
  saved: SavedKicker | null;
  alert: string;
}

/**
 * Resolves `?id=` once per request. `generateMetadata` and the page itself
 * both need the kicker, and React's cache keeps that to a single query.
 */
const requestedKicker = cache(async (id: number | null): Promise<RequestedKicker> => {
  if (id === null) return { saved: null, alert: "" };

  try {
    const saved = loadKickerById(id);
    return { saved, alert: saved ? "" : NOT_FOUND };
  } catch (error) {
    console.error(`Failed to load kicker ${id}`, error);
    return { saved: null, alert: DATABASE_ERROR };
  }
});

async function requestedId(searchParams: SearchParams): Promise<number | null> {
  return parseKickerId((await searchParams).id);
}

/**
 * Per-kicker Open Graph tags, replacing the OpenGraph::renderProperties call
 * in legacy/public/index.php. This is the reason loading has to happen on the
 * server: a crawler following a shared link never runs the editor.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { saved } = await requestedKicker(await requestedId(searchParams));
  const kicker = saved?.kicker ?? { title: "", description: "" };
  const og = openGraphData(kicker, saved?.id ?? null);

  return {
    title: kicker.title ? `${kicker.title} - ${SITE_TITLE}` : SITE_TITLE,
    description: og.description,
    openGraph: {
      title: og.title,
      description: og.description,
      url: og.url,
      images: [og.image],
    },
  };
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const { saved, alert } = await requestedKicker(await requestedId(searchParams));
  const units = unitsForLanguage((await headers()).get("accept-language"));

  // A loaded kicker skips the pitch and opens read-only, which is what the
  // legacy autoStart flag and the `disabled` attribute on bihi-params did.
  const init: EditorInit = saved
    ? {
        kicker: saved.kicker,
        units,
        mode: "readOnly",
        savedId: saved.id,
        share: kickerShareLinks(saved.kicker, saved.id),
        editorOpen: true,
        alert,
      }
    : { units, alert };

  return <App init={init} landing={<Landing units={units} />} />;
}
