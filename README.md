# Draw me a kicker!

## What is this?

An app for designing ramps (aka jumps, aka kickers) for mountainboarding, biking,
skateboarding and whatnot.

The target audience is the type of people who have experience with launching off of
these things, and who want to build a new one. They'll have an idea of how tall they
want the jump, and what kind of exit angle they'll want. Some people like flatter,
mellow jumps that are good for distance jumps, others will prefer steeper, floaty
jumps that are good for tricks.

![](public/images/default-kicker.png)

## Running it

Requires Node 22+ and pnpm.

```sh
pnpm install
pnpm dev
```

Other scripts:

| Script              | What it does                                                   |
| ------------------- | -------------------------------------------------------------- |
| `pnpm build`        | Production build, then the service worker                      |
| `pnpm start`        | Serve the build on port 3000                                   |
| `pnpm test`         | Geometry, unit, store, share, local library and database tests  |
| `pnpm typecheck`    | `tsc --noEmit`                                                 |
| `pnpm db:generate`  | Write a migration into `drizzle/` after a schema edit           |
| `pnpm db:studio`    | Browse the database                                            |
| `pnpm assets:icons` | Redraw the PWA icons from the kicker geometry                  |

`pnpm build` runs `serwist build` after `next build`, which is what produces
`public/sw.js` (gitignored, since it is build output). Building the worker
afterwards rather than from inside the bundler is what lets the precache
manifest see the prerendered output, so the offline shell ends up in it.

The service worker is disabled in `pnpm dev`. Offline behaviour has to be
checked against `pnpm build && pnpm start`.

### Configuration

Both are optional and both only matter on the server.

| Variable         | Default                     | What it does                          |
| ---------------- | --------------------------- | ------------------------------------- |
| `KICKER_DB_PATH` | `data/kickers.db`           | Where the SQLite file lives           |
| `SITE_URL`       | `http://drawmeakicker.com`  | Origin used for share and `og:` links |

The database file and its schema are created on first use, so there is no
setup step.

## Desktop app

The same editor as a standalone app for macOS and Windows, via
[Tauri](https://tauri.app). Requires a Rust toolchain on top of Node and pnpm.

| Script              | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `pnpm app:dev`      | The app, against the Vite dev server, with reload   |
| `pnpm app:build`    | Installers for the machine you are on               |
| `pnpm desktop:dev`  | Just the frontend, in a browser on port 1420        |
| `pnpm desktop:build`| Just the frontend bundle, into `desktop/dist/`      |

Every React component, the scene, the store and the local library are imported
from `src/` unchanged. `desktop/` holds only the shell — an entry point, an
`index.html` standing in for `layout.tsx`, and the three answers below.

### Why not `next build`

Next builds the website and cannot build this. `/` is a server component that
reads `headers()` and queries SQLite so that a shared link arrives with its
`og:` tags already in the HTML, and `/api/kickers` is a route handler; neither
survives `output: "export"`. Making the site exportable would mean giving up
the thing that makes shared links work, to produce a build that still would not
have a server in it. Vite compiles the same `src/` tree as a plain SPA instead,
and Tauri serves the result.

That leaves the desktop app with no server involved anywhere. Designs live in
IndexedDB, the library reads back from it, and JSON export / import moves them
between devices; there is no outbox because there is nothing to push at, and
no share step because a link points at a server this app does not have. What
the PWA calls its offline fallback is what the desktop always looks like, on
purpose.

### What the shell has to answer

Two things the editor does are browser assumptions rather than editor logic,
so they became a seam in `src/lib/runtime.ts` whose defaults are the existing
web behaviour spelled out. Nothing that does not call `configureRuntime` can
tell it is there.

| Assumption                       | Why it breaks                                                        | What the desktop does              |
| -------------------------------- | -------------------------------------------------------------------- | ---------------------------------- |
| There is a server behind the app | The document comes from `tauri://localhost`, and this build ships with no server at all | `hasServer: false`, and the outbox, share step and sync chip never mount |
| `<a download>` saves a file      | WKWebView ignores the attribute, so Export appears to do nothing     | A native save dialog and a write in Rust |

The export is written by a Rust command rather than the filesystem plugin. Both
ends already belong to the app — the bytes come from the editor's own canvas or
its PDF builder, and the path from a dialog it opened — and going through the
plugin would mean granting the WebView a write scope wide enough to cover
anywhere the user might pick, which is all of it, to save one file. The
command picks its filter from the filename extension, so the PNG and PDF
exports go through the same seam.

Outbound links are handed to the real browser
(`desktop/src/external-links.ts`). A window with no address bar and no back
button would otherwise load Twitter's share dialog over the editor, taking an
unsaved design with it.

### Two things that look removable and are not

`script-src` carries `'wasm-unsafe-eval'`. It allows WebAssembly compilation
and nothing else — it is not `'unsafe-eval'`, and no JavaScript becomes
evaluable because of it. The SDF text generator asks for WebAssembly, so
without it that request is refused on every editor open.

It only buys anything on Windows. WebKit has not implemented the directive:
macOS refuses the module regardless and reports it as `script-src` blocking
`eval`, which is worth knowing before reading that violation as a real problem.
Both platforms fall back to the generator's WebGL path and draw the same
labels, so the visible cost is nothing and the directive is kept for WebView2's
sake rather than being widened to `'unsafe-eval'` to satisfy WebKit.

`desktop/src/text-rendering.ts` turns off troika's typesetting worker. Its
comment has the detail; the short version is that the worker is built by
stringifying functions, which this bundler breaks, and the resulting throw
comes from inside the canvas and takes the entire scene down with it. The
symptom is an empty blueprint frame, which does not look like it has anything
to do with text.

Both were found by serving `desktop/dist` under the production CSP, because
neither reproduces in `pnpm app:dev`: Tauri applies the policy to its own
`tauri://` responses and not to the dev server it loads from in development.
Worth remembering before trusting a dev run to say the app works.

VR needs no special handling: `useVrSupported` asks `navigator.xr`, which
neither WebView provides, so the toolbar button never appears.

### Building for both platforms

Tauri links against the host's own WebView, so there is no cross-compiling:
`pnpm app:build` produces installers for the machine it runs on and nothing
else. `.github/workflows/desktop.yml` is what actually covers both, building
Apple silicon, Intel and Windows on their own runners and uploading the `.dmg`
and `.exe` as artifacts.

Neither build is code-signed, so both will need to be allowed past Gatekeeper
and SmartScreen by hand.

## How it fits together

- `src/lib/kicker` — the geometry. Arc radius, footprint, surface length, the side
  and surface outlines, strut placement, unit formatting and the cut list. No
  three.js, so it is unit-testable and shared with the server.
- `src/lib/drawing` — the projection from ramp metres to 2D output units, plus
  the blueprint frame's notch geometry. Used by both the landing page's SVG
  illustrations and the PDF export's side view, so the two cannot draw the
  same kicker in two different ways.
- `src/lib/pdf` — the [build plan](#build-plan) export. jsPDF is imported
  lazily from `document.ts` so it stays out of the editor bundle until the
  user asks for it.
- `src/db` — the SQLite layer (Drizzle ORM). One `kickers` table, insert and
  read-by-id, with migrations in `drizzle/` applied when the file is opened.
  The insert is idempotent per client key; see [Offline](#offline).
- `src/lib/local` — the on-device library and the outbox that pushes it to the
  server. See [Offline](#offline).
- `src/app/page.tsx` — resolves `?id=` before anything renders, so a shared link
  arrives with its kicker and its `og:` tags already in the HTML.
- `src/app/api/kickers/route.ts` — the save endpoint.
- `src/lib/share.ts` — Open Graph data and the Twitter/Facebook share links.
- `src/store/editor-store.ts` — all editor state, including the four-state editor
  mode machine. Derived dimensions are computed by selector, never stored.
- `src/scene` — the react-three-fiber scene. One component per part, with the
  visibility truth table in `visibility.ts` and the orthographic bounding-box fit
  for the 2D blueprint view in `Cameras.tsx`.
- `src/components` — the UI: landing page, stepped sidebar, toolbar, and the stack
  of three canvases (WebGL scene, blueprint frame, and a hidden one for compositing
  PNG exports).
- `src/components/landing` — the pitch above the editor. A server component, so
  its illustrations cost no script: they are SVG generated from `src/lib/kicker`
  by `src/lib/drawing/project.ts`, which is also why they cannot drift from
  what the editor draws. Only the call-to-action button crosses into the
  client.

- `desktop/` — the shell for the [desktop app](#desktop-app), and nothing else:
  everything it renders is imported from the directories above.
- `src-tauri/` — the Rust side of the desktop app. The window, the plugins it is
  allowed to use, and the one command that writes a PNG or PDF export.

The editor is code-split behind `next/dynamic`: three.js and the XR runtime only
download once the visitor asks for the editor. The desktop build keeps that
split rather than paying for a WebGL context at launch, by aliasing the module
to a `React.lazy` wrapper — see `desktop/src/shims/next-dynamic.tsx`.

## Build plan

The Visualize step offers a two-page PDF beside the PNG export. Page one lists
the name, id, the six measurements and a cut list, next to a black-and-white
3D view. Page two is the annotated 2D side view redrawn as vector paths inside
the notched blueprint frame — the same paths the on-screen scene draws, so
what is on page two is what the editor drew and nothing else.

The pieces:

- `src/lib/kicker/cut-list.ts` — every piece of timber the ramp is built from,
  derived from `calculateSidePoints` and `calculateStrutPlacements`. Struts
  are grouped by their section, so the default kicker's list reads "13 struts,
  80mm timber, 1.00m long" rather than as a wall of identical rows.
- `src/lib/drawing/project.ts` — the projection from ramp metres to 2D output
  units, also used by the landing page's SVG illustrations. Sharing one
  projection is what stops the paper drawing and the on-screen one from
  parting ways.
- `src/lib/drawing/frame.ts` — the notched frame's geometry, consumed by both
  the on-screen `BlueprintBorder` and the PDF.
- `src/lib/pdf/side-view.ts` — the side view as a flat list of drawing
  primitives (polyline, filled polygon, text). Free of jsPDF, so it is
  testable against a plain fake and could be pointed at SVG or Canvas without
  change.
- `src/lib/pdf/three-dee.ts` — reads the editor's WebGL canvas after briefly
  flipping the visualization to outline-only 3D, and inverts the white lines
  onto white with `globalCompositeOperation = "difference"`. The visualization
  is restored before the export resolves, so the visible state the user
  returned to is the one they left.
- `src/lib/pdf/document.ts` — the assembler. jsPDF is imported dynamically
  here, which is why the ~400kB library only downloads when someone actually
  presses Export PDF.

The Rust side takes the extension from the filename to decide which filter to
offer in the save dialog. Anything unrecognised falls back to PNG — see
`save_export` in `src-tauri/src/lib.rs`.

## Units

Metres or feet and inches, chosen from the masthead or from the editor's
toolbar. Both are the same control: they read and write `units` in the editor
store, so neither can get out of step with the other or with anything measured
on the page.

Where the starting value comes from, in order:

1. The choice stored under `drawmeakicker.units`, if there is one.
   `src/lib/units-preference.ts` owns that key and tolerates storage that
   throws, which Safari's private browsing does.
2. Otherwise `Accept-Language`, via `unitsForLanguage`. Exactly `en-US` gets
   feet and everything else gets metres. The offline shell has no request to
   read, so it asks `navigator.languages` for the same answer.

Only a deliberate change is written to storage. `initialize` sets the same
field from the language guess, and remembering that would turn a guess into a
decision the visitor never made.

The landing page is server-rendered, so it cannot re-render when the toggle
moves. It carries every measurement in both units and hides one with CSS —
see `BothUnits` — which keeps the switch instant and its illustrations out of
the client bundle. The consequence is that a returning visitor whose stored
choice differs from their language sees the page correct itself once it starts
running; a cookie would let the server render it right the first time, at the
cost of sending the preference on every request.

## Offline

The app is installable and works with no network. Designs are saved to the
device first and pushed to the server afterwards, so the server being down,
slow or broken costs you a share link and nothing else.

Saving writes a record to IndexedDB and returns. The outbox then tries to POST
it, and the design carries one of three states:

| State     | Meaning                               | Shown as                             |
| --------- | ------------------------------------- | ------------------------------------ |
| `pending` | Saved here, not yet accepted          | "waiting for the server", with Retry |
| `synced`  | Has a server id and share links       | "shareable"                          |
| `failed`  | The server refused it and always will | the server's reason, with Retry      |

Only a 400 is `failed`. A 5xx, a timeout, a network error, and a 2xx whose body
cannot be parsed are all `pending`, because being wrongly transient costs a few
retries where being wrongly permanent costs the design its share link for good.
Retries back off exponentially, the delay is stored in the record so it survives
a reload, and they cannot duplicate anything — see below.

- `src/lib/local/designs.ts` — the IndexedDB store. Insert-only, like the
  server. Records are validated on read one at a time, so an unreadable row is
  reported as one missing design rather than an empty library.
- `src/lib/local/outbox.ts` — the queue. Claims a design with an expiring lease
  so two tabs cannot post it at once and a crashed tab cannot strand it.
- `src/lib/local/transfer.ts` — JSON export and import of the whole library.
- `src/app/sw.ts` — the service worker.
- `src/app/~offline/page.tsx` — the shell the worker falls back to. It exists
  because `/` reads `headers()` and `searchParams` to resolve `?id=`, so it is
  dynamic and the build emits no HTML for it to precache.

A shared link is resolved by the server when there is one and out of the local
library when there is not, which is why a link to your own design still opens
during an outage. An id this device has never seen says so, rather than showing
a blank editor.

Two things are deliberately conservative. The worker does not call
`skipWaiting`, so a new version waits for every tab to close: a running page
holds content-hashed chunk URLs that only its own generation's precache has.
And documents are never runtime-cached, for the same reason — a cached `/` from
one build would point at chunks no later build has.

### Retries cannot duplicate a row

A save whose response is lost looks exactly like one that never arrived, so the
outbox retries it. To keep that from storing the design twice, each save
carries the design's local id as an `Idempotency-Key` header, which the server
stores in a unique `clientKey` column. A retry of a save that already committed
conflicts on that key, and the server answers `200` with the row it already has
instead of inserting another.

Still insert-only: the key makes the insert happen at most once, and nothing
updates a row. A request without the header inserts every time, as before,
which is what rows written before the column existed rely on.

Ids therefore have gaps. SQLite allocates a rowid before it notices the
conflict, so a recognised replay costs an id without leaving a row.

## Assets

`public/models/board.glb` is generated from the original Collada file:

```sh
pnpm assets:board
```

## Porting notes

The original app (Polymer 0.8, three.js r71, PHP, MySQL) is preserved under
`legacy/` for reference. It is not built or served, and it is not wired to
anything — it is there so the port can be checked against it.

Saving and loading follow the legacy app closely, including its quirks worth
keeping: a save always inserts, never updates, so a loaded kicker is read-only
until Modify drops its id; the `utm` parameter still distinguishes the two share
buttons; and `Accept-Language` still decides which unit a first visit starts in.

Six things were changed on purpose:

- `angle` is stored as REAL. The slider reaches 89.9, which the legacy
  `int(11)` column would have truncated to 89 and its `IntValidator` rejected
  outright.
- An unknown `?id=` renders the default kicker with an explanation, where the
  original let the exception escape as a 500.
- Saving twice no longer produces `?id=1?id=2`. The legacy editor appended to
  `window.location.href` without clearing the previous query string.
- The table has a `clientKey` column the legacy one had no need for. It saved
  synchronously from a form, where a retry was the user pressing the button
  again; this one retries in the background and has to be able to say "this is
  that same save" (see [Offline](#offline)).
- The landing page is not a port. The original was two paragraphs and a video
  over a photograph of a sketch, which explained the idea but never showed what
  the app gives you. It now walks through that in drawings, and the photograph
  is still there as the thing being improved on.
- Feet go to exactly `en-US`. The legacy check gave them to `en-CA` as well,
  and Canada is metric for this sort of thing.
- The unit is a remembered preference rather than a per-request guess. The
  language only decides where a first visit starts; see [Units](#units).
