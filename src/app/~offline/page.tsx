import type { Metadata } from "next";
import { OfflineApp } from "@/components/OfflineApp";
import { SITE_TITLE } from "@/lib/site";

/*
 * The service worker's document fallback, and the only reason this route
 * exists: it has to produce a real HTML file at build time for the precache
 * manifest to contain. `force-static` is the guard rail rather than the
 * mechanism, since nothing here is dynamic anyway. Adding `headers()` or
 * `searchParams` to this route would otherwise remove the offline shell from
 * the manifest and break offline start-up silently; this way the build fails.
 */
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: SITE_TITLE,
  // An internal fallback, not something anyone should reach from a search result.
  robots: { index: false, follow: false },
};

export default function Offline() {
  return <OfflineApp />;
}
