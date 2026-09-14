import { describe, expect, it, vi } from "vitest";
import { defaultKicker } from "@/lib/kicker";
import type { SaveKickerErrors, SaveKickerResult } from "@/lib/kicker-api";

// Has to be in place before the route pulls in the database client, which
// resolves its file once and memoizes the connection.
vi.stubEnv("KICKER_DB_PATH", ":memory:");
const { POST } = await import("./route");

function post(body: unknown): Promise<Response> {
  return POST(
    new Request("http://localhost/api/kickers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/kickers", () => {
  it("stores a kicker and answers with its id and share links", async () => {
    const response = await post({ ...defaultKicker, title: "Le gros" });
    expect(response.status).toBe(201);

    const { id, kicker, share } = (await response.json()) as SaveKickerResult;
    expect(id).toBeGreaterThan(0);
    expect(kicker).toEqual({ ...defaultKicker, title: "Le gros" });
    expect(new URL(share.twitterUrl).searchParams.get("url")).toContain(`?id=${id}`);
    expect(new URL(share.facebookUrl).searchParams.get("u")).toContain(`?id=${id}`);
  });

  it("rejects a kicker outside the slider ranges", async () => {
    const response = await post({ ...defaultKicker, height: 30 });
    expect(response.status).toBe(400);

    const { errors } = (await response.json()) as SaveKickerErrors;
    expect(errors[0]).toContain("height");
  });

  it("rejects a body with fields missing", async () => {
    const incomplete: Record<string, unknown> = { ...defaultKicker };
    delete incomplete.height;
    expect((await post(incomplete)).status).toBe(400);
  });

  it("rejects a body that is not a kicker at all", async () => {
    expect((await post("nope")).status).toBe(400);
  });

  it("ignores an id supplied by the client", async () => {
    // The table hands out ids. Honouring one from the body would turn a save
    // into an overwrite of someone else's kicker.
    const first = (await (await post(defaultKicker)).json()) as SaveKickerResult;
    const second = (await (
      await post({ ...defaultKicker, id: first.id, title: "Usurper" })
    ).json()) as SaveKickerResult;

    expect(second.id).not.toBe(first.id);
    expect(second.kicker).not.toHaveProperty("id");
  });
});
