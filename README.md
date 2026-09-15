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

## How it fits together

- `src/lib/kicker` — the geometry. Arc radius, footprint, surface length, the side
  and surface outlines, strut placement, and unit formatting. No three.js, so it is
  unit-testable and shared with the server.
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
  by `diagram.ts`, which is also why they cannot drift from what the editor
  draws. Only the call-to-action button crosses into the client.

The editor is code-split behind `next/dynamic`: three.js and the XR runtime only
download once the visitor asks for the editor.

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
buttons; and `Accept-Language` still starts US and Canadian visitors in feet.

Four things were changed on purpose:

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
