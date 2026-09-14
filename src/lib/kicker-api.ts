import { kickerSchema, type Kicker } from "@/lib/kicker";
import type { ShareLinks } from "@/lib/share";

export const SAVE_ENDPOINT = "/api/kickers";

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
 * Posts a kicker and returns its new id and share links.
 *
 * Replaces the hand-rolled XMLHttpRequest/FormData helper in bihi-save.html.
 * Errors surface as a rejected promise carrying the server's message, which is
 * what the Save panel puts in the alert banner.
 */
export async function saveKicker(kicker: Kicker): Promise<SaveKickerResult> {
  // Parsing here keeps the body to exactly the stored columns, and catches a
  // bad kicker without a round trip. safeParse rather than parse because a
  // ZodError's message is a JSON dump, and this message reaches the user.
  const parsed = kickerSchema.safeParse(kicker);
  if (!parsed.success) {
    throw new Error(describeInvalidKicker(parsed.error)[0] ?? GENERIC_SAVE_ERROR);
  }

  let response: Response;
  try {
    response = await fetch(SAVE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
  } catch {
    throw new Error("Network error: the kicker was not saved.");
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const errors = (payload as SaveKickerErrors | null)?.errors;
    throw new Error(errors?.[0] ?? GENERIC_SAVE_ERROR);
  }

  return payload as SaveKickerResult;
}
