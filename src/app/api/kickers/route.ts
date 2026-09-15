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

/**
 * The header carrying the client's own id for the design, which makes the save
 * idempotent. Optional: without it every request inserts, as before.
 *
 * Long enough for a uuid and a little more, capped because it reaches a column
 * and an unbounded one from an anonymous endpoint is somebody else's disk.
 */
const KEY_HEADER = "idempotency-key";
const MAX_KEY_LENGTH = 64;

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);

  const parsed = kickerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<SaveKickerErrors>(
      { errors: describeInvalidKicker(parsed.error) },
      { status: 400 },
    );
  }

  const key = request.headers.get(KEY_HEADER);
  if (key !== null && (key.length === 0 || key.length > MAX_KEY_LENGTH)) {
    return NextResponse.json<SaveKickerErrors>(
      { errors: [`${KEY_HEADER} must be 1 to ${MAX_KEY_LENGTH} characters`] },
      { status: 400 },
    );
  }

  try {
    const { id, kicker, created } = createKicker(parsed.data, { clientKey: key });
    return NextResponse.json<SaveKickerResult>(
      { id, kicker, share: kickerShareLinks(kicker, id) },
      // 200 for a replay: the row was not created by this request.
      { status: created ? 201 : 200 },
    );
  } catch (error) {
    console.error("Failed to save a kicker", error);
    return NextResponse.json<SaveKickerErrors>(
      { errors: [GENERIC_SAVE_ERROR] },
      { status: 500 },
    );
  }
}
