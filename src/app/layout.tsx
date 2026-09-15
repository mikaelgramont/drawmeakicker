import type { Metadata, Viewport } from "next";
import { SITE_TITLE } from "@/lib/site";
import "@/styles/global.css";
import { SerwistProvider } from "./serwist";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: "Design your next kicker in 3D!",
  appleWebApp: {
    // iOS ignores most of the web app manifest, so the standalone display mode
    // and the launcher icon have to be declared here as well.
    capable: true,
    title: "Kicker",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3b69d5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/*
          Registration is skipped in development: the worker built there has no
          precache manifest and routes everything through NetworkOnly, so it
          would only add a moving part between an edit and the reload.

          Both opt-outs matter for an app whose whole point is surviving a bad
          network. reloadOnOnline would reload the page the moment connectivity
          returned, throwing away an in-progress design along with the WebGL
          context; the outbox syncs without needing the page reloaded.
          cacheOnNavigation monkey-patches history.replaceState, which
          useShareableUrl calls on every save, and it would only ask the worker
          to cache documents that sw.ts deliberately does not cache.
        */}
        <SerwistProvider
          swUrl="/sw.js"
          disable={process.env.NODE_ENV === "development"}
          reloadOnOnline={false}
          cacheOnNavigation={false}
        >
          {children}
        </SerwistProvider>
      </body>
    </html>
  );
}
