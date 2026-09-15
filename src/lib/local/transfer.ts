/**
 * Getting the whole library in and out as a file.
 *
 * The escape hatch. Everything else here assumes the browser keeps what it was
 * given, and mostly it does, but the storage is still one origin in one browser
 * profile on one device: cleared site data, a wiped profile, a dead laptop. An
 * export is the answer to "how do I get my designs off this machine", and it
 * does not need the server to be reachable to work.
 *
 * The format is deliberately the stored record rather than something prettier,
 * so an import can restore sync state instead of re-queueing designs the
 * server already has.
 */
import { z } from "zod";
import {
  getDesignByServerId,
  listDesigns,
  localDesignSchema,
  putDesign,
  type DesignsDb,
  type LocalDesign,
} from "./designs";

const FORMAT_VERSION = 1;

export const NOT_A_LIBRARY = "That file is not a Draw me a kicker library.";

const libraryFileSchema = z.object({
  format: z.literal("drawmeakicker-library"),
  version: z.number().int().positive(),
  exportedAt: z.string(),
  // Validated per design on the way in, not here, so one bad entry in someone's
  // file does not cost them the rest of it.
  designs: z.array(z.unknown()),
});

export interface LibraryFile {
  format: "drawmeakicker-library";
  version: number;
  exportedAt: string;
  designs: LocalDesign[];
}

/** The library as a JSON string, ready to be written to a file. */
export async function exportLibrary(db?: DesignsDb): Promise<string> {
  const { designs } = await listDesigns(db);
  const file: LibraryFile = {
    format: "drawmeakicker-library",
    version: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    designs,
  };
  return JSON.stringify(file, null, 2);
}

export interface ImportSummary {
  imported: number;
  /** Already present, matched by server id. */
  skipped: number;
  /** Entries in the file that could not be read. */
  unreadable: number;
}

/**
 * Merges a library file into this device's library.
 *
 * Adds rather than replaces, because the alternative is an import quietly
 * destroying whatever was already here. Designs are given fresh local handles
 * so an import can never overwrite an existing record, and ones the server
 * already knows by the same id are skipped so re-importing the same file twice
 * does not produce two of everything.
 */
export async function importLibrary(json: string, db?: DesignsDb): Promise<ImportSummary> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error(NOT_A_LIBRARY);
  }

  const file = libraryFileSchema.safeParse(parsed);
  if (!file.success) throw new Error(NOT_A_LIBRARY);

  const summary: ImportSummary = { imported: 0, skipped: 0, unreadable: 0 };

  for (const entry of file.data.designs) {
    const design = localDesignSchema.safeParse(entry);
    if (!design.success) {
      summary.unreadable += 1;
      continue;
    }

    const { serverId } = design.data;
    if (serverId !== null && (await getDesignByServerId(serverId, db))) {
      summary.skipped += 1;
      continue;
    }

    await putDesign({ ...design.data, localId: crypto.randomUUID() }, db);
    summary.imported += 1;
  }

  return summary;
}
