import type { Metadata, Viewport } from "next";
import { SITE_TITLE } from "@/lib/site";
import "@/styles/global.css";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: "Design your next kicker in 3D!",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
