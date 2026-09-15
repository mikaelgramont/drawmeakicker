import { z } from "zod";
import { kickerSchema, type Kicker } from "@/lib/kicker";
import type { ShareLinks } from "@/lib/share";

export const SAVE_ENDPOINT = "/api/kickers";

/** How long a save may take before it counts as unavailable. */
const REQUEST_TIMEOUT_MS = 15000;

/** What POST /api/kickers answers with on success. */
export interface SaveKickerResult {
  id: number;
  kicker: Kicker;
  share: ShareLinks;
}

/** What it answers with when the body is rejected or the insert fails. */
export interface SaveKickerErrors {
  errors: string[];
}

/** The message the legacy save.php returned for any unexpected failure. */
export const GENERIC_SAVE_ERROR =
  "An error occured, we were unable to save the kicker. Please try again later.";

export const SERVER_UNAVAILABLE = "The server could not be reached. This will sync later.";

/**
 * The success body, checked rather than asserted.
 *
 * This replaces a `payload as SaveKickerResult` cast sitting directly on the
 * output of `response.json().catch(() => null)`. A server answering 201 with an
 * HTML error page, or a proxy answering with an empty body, would pass straight
 * through that cast, and the id written back would be `undefined`: a design
 * recorded as synced, with no server id, never shareable and never retried
 * because it no longer looks pending. A degraded server's body is untrusted
 * input, exactly like a request body.
 */
const saveKickerResultSchema: z.ZodType<SaveKickerResult> = z.object({
  id: z.number().int().positive(),
  kicker: kickerSchema,
  share: z.object({
    twitterUrl: z.string(),
    facebookUrl: z.string(),
  }),
});

/**
 * Flattens a zod failure into the list of "<field> <problem>" strings that the
 * legacy validators produced, so the alert banner can show the first one.
 */
export function describeInvalidKicker(error: {
  issues: readonly { path: readonly (string | number | symbol)[]; message: string }[];
}): string[] {
  return error.issues.map((issue) => {
    const field = issue.path.join(".");
    return field ? `${field}: ${issue.message}` : issue.message;
  });
}

/**
 * What came of trying to send a design to the server.
 *
 * Split three ways rather than into success and failure, because the outbox has
 * to treat the two failures completely differently and the distinction is not
 * recoverable from an Error message.
 *
 * `rejected` means the server understood and refused: the kicker is invalid, so
 * retrying it unchanged cannot help. `unavailable` means we never got a usable
 * answer, which includes a 500 — the route returns one when the insert fails,
 * so a dead database lands here, and marking that permanent would strand a
 * perfectly good design forever.
 */
export type SaveOutcome =
  | { kind: "saved"; result: SaveKickerResult }
  | { kind: "rejected"; message: string }
  | { kind: "unavailable"; message: string };

/**
 * Posts a kicker and reports what happened.
 *
 * Never throws: every way this can go wrong is a `SaveOutcome`, so a caller
 * cannot accidentally treat an outage as a rejection by catching too broadly.
 */
export async function postKicker(
  kicker: Kicker,
  { timeoutMs = REQUEST_TIMEOUT_MS }: { timeoutMs?: number } = {},
): Promise<SaveOutcome> {
  // Checked here too, so an invalid kicker is a rejection without a round trip.
  // This is also what catches a design saved under slider ranges that have
  // since narrowed: permanent, reported, and still readable locally.
  const parsed = kickerSchema.safeParse(kicker);
  if (!parsed.success) {
    return {
      kind: "rejected",
      message: describeInvalidKicker(parsed.error)[0] ?? GENERIC_SAVE_ERROR,
    };
  }

  let response: Response;
  try {
    response = await fetch(SAVE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      // A server that accepts the connection and then says nothing must not
      // hold a claimed record open indefinitely.
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    return { kind: "unavailable", message: SERVER_UNAVAILABLE };
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const errors = (payload as SaveKickerErrors | null)?.errors;
    const message = errors?.[0] ?? GENERIC_SAVE_ERROR;
    // Only a 400 is the kicker's fault. Everything else — 5xx, a proxy's 502, a
    // 404 from a moved endpoint — might succeed later, and being wrongly
    // transient only costs retries where being wrongly permanent costs the user
    // their share link for good.
    return response.status === 400
      ? { kind: "rejected", message }
      : { kind: "unavailable", message };
  }

  const result = saveKickerResultSchema.safeParse(payload);
  if (!result.success) {
    // A 2xx we cannot read is not a success and is not the kicker's fault
    // either, so it stays queued.
    return { kind: "unavailable", message: SERVER_UNAVAILABLE };
  }

  return { kind: "saved", result: result.data };
}
