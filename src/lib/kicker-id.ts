/**
 * Reads an id out of a `?id=` query string. Anything that is not a positive
 * integer is treated as absent rather than as an error: the legacy app fed
 * such values straight to a bound query, which simply found no row.
 *
 * Lives here rather than beside the database queries because both sides of a
 * shared link need it: the server resolves `?id=` against SQLite, and when the
 * server cannot be reached the browser resolves the same value against the
 * local library, which must not drag better-sqlite3 into the bundle to do it.
 */
export function parseKickerId(value: string | string[] | undefined): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return id > 0 && Number.isSafeInteger(id) ? id : null;
}
