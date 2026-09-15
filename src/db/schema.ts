import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { REPRESENTATION_TYPES } from "@/lib/kicker";

/**
 * One saved kicker. The columns are those of the legacy MyISAM `kickers` table
 * (legacy/bihi_kickers.sql), with two deliberate differences:
 *
 * - every column is NOT NULL, because a row is only ever written from a
 *   fully validated `Kicker` rather than from a partial `$_POST`;
 * - `angle` is REAL where the original was `int(11)`. The exit angle slider
 *   reaches 89.9 (see parameterRanges), which the legacy IntValidator would
 *   have rejected and an integer column would have truncated to 89.
 *
 * and one addition, `clientKey`, which the legacy app had no need for because
 * it saved synchronously from a form.
 */
export const kickers = sqliteTable(
  "kickers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    height: real("height").notNull(),
    width: real("width").notNull(),
    angle: real("angle").notNull(),

    repType: text("repType", { enum: REPRESENTATION_TYPES }).notNull(),
    textured: integer("textured", { mode: "boolean" }).notNull(),

    annotations: integer("annotations", { mode: "boolean" }).notNull(),
    grid: integer("grid", { mode: "boolean" }).notNull(),
    mountainboard: integer("mountainboard", { mode: "boolean" }).notNull(),
    rider: integer("rider", { mode: "boolean" }).notNull(),

    fill: integer("fill", { mode: "boolean" }).notNull(),
    borders: integer("borders", { mode: "boolean" }).notNull(),

    title: text("title").notNull(),
    description: text("description").notNull(),

    /**
     * The saving client's own id for this design, used to make the insert
     * idempotent.
     *
     * Nullable, and the only nullable column here: rows written before this
     * existed have no key, and a client that sends no key still gets the
     * original insert-every-time behaviour. SQLite's unique index treats each
     * NULL as distinct, so those rows do not collide with each other.
     *
     * It is an opaque string as far as the server is concerned. The client
     * sends a random uuid, which carries nothing about the device.
     */
    clientKey: text("clientKey"),
  },
  (table) => [uniqueIndex("kickers_clientKey_unique").on(table.clientKey)],
);

export type KickerRow = typeof kickers.$inferSelect;
