import { z } from "zod";
import { parameterRanges } from "./config";

export const REPRESENTATION_TYPES = ["2d", "3d"] as const;
export type RepresentationType = (typeof REPRESENTATION_TYPES)[number];

export const UNITS = ["m", "ft"] as const;
export type Unit = (typeof UNITS)[number];

export const DEGREES = "\u00b0";

/**
 * The persisted shape of a kicker. Mirrors the columns of the legacy `kickers`
 * table (legacy/bihi_kickers.sql) and doubles as the request body schema for
 * the Phase 2 save endpoint, replacing legacy/php/validators.php.
 */
export const kickerSchema = z.object({
  height: z.number().min(parameterRanges.height.min).max(parameterRanges.height.max),
  width: z.number().min(parameterRanges.width.min).max(parameterRanges.width.max),
  angle: z.number().min(parameterRanges.angle.min).max(parameterRanges.angle.max),

  repType: z.enum(REPRESENTATION_TYPES),
  textured: z.boolean(),

  annotations: z.boolean(),
  grid: z.boolean(),
  mountainboard: z.boolean(),
  rider: z.boolean(),

  fill: z.boolean(),
  borders: z.boolean(),

  title: z.string().max(255),
  description: z.string().max(255),
});

export type Kicker = z.infer<typeof kickerSchema>;

/** Values derived from height/width/angle. */
export interface KickerResults {
  /** Radius of the transition arc. */
  radius: number;
  /** Footprint length, including the extra length behind the lip. */
  length: number;
  /** Arc length of the riding surface. */
  arc: number;
}

/** Defaults from KickerDao::getDefaultData in legacy/php/kickerdao.php. */
export const defaultKicker: Kicker = {
  height: 1.2,
  width: 1,
  angle: 45,

  repType: "2d",
  textured: true,

  annotations: true,
  grid: true,
  mountainboard: false,
  rider: false,

  fill: true,
  borders: true,

  title: "",
  description: "",
};
