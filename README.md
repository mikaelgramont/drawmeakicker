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

| Script            | What it does                                          |
| ----------------- | ----------------------------------------------------- |
| `pnpm build`      | Production build                                      |
| `pnpm start`      | Serve the build on port 3000                          |
| `pnpm test`       | Geometry, unit, store, share and database tests        |
| `pnpm typecheck`  | `tsc --noEmit`                                        |
| `pnpm db:generate` | Write a migration into `drizzle/` after a schema edit |
| `pnpm db:studio`  | Browse the database                                   |

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

The editor is code-split behind `next/dynamic`: three.js and the XR runtime only
download once the visitor asks for the editor.

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

Three things were changed on purpose:

- `angle` is stored as REAL. The slider reaches 89.9, which the legacy
  `int(11)` column would have truncated to 89 and its `IntValidator` rejected
  outright.
- An unknown `?id=` renders the default kicker with an explanation, where the
  original let the exception escape as a 500.
- Saving twice no longer produces `?id=1?id=2`. The legacy editor appended to
  `window.location.href` without clearing the previous query string.
