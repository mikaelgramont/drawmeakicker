import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/global.css";
import { DesktopApp } from "./DesktopApp";
import { interceptExternalLinks } from "./external-links";
import { installDesktopRuntime } from "./runtime";
import { typesetOnMainThread } from "./text-rendering";

/*
 * All three run before the first render. The editor may post to the outbox or
 * open a link as soon as it mounts, and doing either against the browser
 * defaults would fail in a way that looks like the feature is broken; the text
 * builder ignores configuration once a font has been asked for.
 */
installDesktopRuntime();
interceptExternalLinks();
typesetOnMainThread();

const container = document.getElementById("root");
if (!container) throw new Error("index.html is missing #root");

createRoot(container).render(
  <StrictMode>
    <DesktopApp />
  </StrictMode>,
);
