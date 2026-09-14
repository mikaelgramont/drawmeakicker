import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
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
 */
export const kickers = sqliteTable("kickers", {
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
});

export type KickerRow = typeof kickers.$inferSelect;
