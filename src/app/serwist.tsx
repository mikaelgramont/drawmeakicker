"use client";

/*
 * SerwistProvider registers the worker from the browser, so it cannot be
 * imported straight into the server-rendered layout. This re-export is the
 * "use client" boundary that lets it be.
 */
export { SerwistProvider } from "@serwist/next/react";
