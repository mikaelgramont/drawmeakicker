import { NextResponse } from "next/server";
import { createKicker } from "@/db/kickers";
import { kickerSchema } from "@/lib/kicker";
import {
  describeInvalidKicker,
  GENERIC_SAVE_ERROR,
  type SaveKickerErrors,
  type SaveKickerResult,
} from "@/lib/kicker-api";
import { kickerShareLinks } from "@/lib/share";

/**
 * Replaces legacy/public/save.php.
 *
 * Same contract in spirit: post a kicker, get back the stored row and the
 * share links for it. The differences are that the body is JSON rather than
 * form data, that failures use HTTP status codes instead of a `status` field,
 * and that validation is one `kickerSchema.safeParse` rather than a validator
 * class per column.
 */
export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);

  const parsed = kickerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<SaveKickerErrors>(
      { errors: describeInvalidKicker(parsed.error) },
      { status: 400 },
    );
  }

  try {
    const { id, kicker } = createKicker(parsed.data);
    return NextResponse.json<SaveKickerResult>(
      { id, kicker, share: kickerShareLinks(kicker, id) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to save a kicker", error);
    return NextResponse.json<SaveKickerErrors>(
      { errors: [GENERIC_SAVE_ERROR] },
      { status: 500 },
    );
  }
}
