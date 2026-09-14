import { describe, expect, it } from "vitest";
import { OG_DESCRIPTION, SITE_TITLE } from "@/lib/site";
import { kickerShareLinks, kickerUrl, openGraphData, shareLinks } from "./share";

const ORIGIN = "https://kickers.test";
const named = { title: "Le gros", description: "Steep, for tricks" };
const untitled = { title: "", description: "" };

describe("open graph data", () => {
  it("describes a saved kicker with its own title", () => {
    expect(openGraphData(named, 7, ORIGIN)).toEqual({
      title: "Le gros",
      description: `Steep, for tricks - ${OG_DESCRIPTION}`,
      url: `${ORIGIN}/?id=7`,
      image: `${ORIGIN}/images/default-kicker.png`,
    });
  });

  it("falls back to the site's own title and description", () => {
    const og = openGraphData(untitled, 7, ORIGIN);
    expect(og.title).toBe(SITE_TITLE);
    expect(og.description).toBe(OG_DESCRIPTION);
  });

  it("points an unsaved kicker at the site root", () => {
    expect(openGraphData(untitled, null, ORIGIN).url).toBe(`${ORIGIN}/`);
  });

  it("ignores a trailing slash on the configured origin", () => {
    expect(kickerUrl(7, `${ORIGIN}/`)).toBe(kickerUrl(7, ORIGIN));
  });
});

describe("share links", () => {
  const { twitterUrl, facebookUrl } = kickerShareLinks(named, 7, ORIGIN);

  it("sends Twitter the url and a title/description caption", () => {
    const url = new URL(twitterUrl);
    expect(url.origin + url.pathname).toBe("https://twitter.com/intent/tweet");
    expect(url.searchParams.get("url")).toBe(`${ORIGIN}/?id=7&utm=twitter`);
    expect(url.searchParams.get("text")).toBe(
      `Le gros - Steep, for tricks - ${OG_DESCRIPTION}`,
    );
  });

  it("sends Facebook just the url", () => {
    const url = new URL(facebookUrl);
    expect(url.origin + url.pathname).toBe("https://www.facebook.com/sharer.php");
    expect(url.searchParams.get("u")).toBe(`${ORIGIN}/?id=7&utm=facebook`);
  });

  it("tags each network so the two can be told apart in analytics", () => {
    expect(new URL(twitterUrl).searchParams.get("url")).toContain("utm=twitter");
    expect(new URL(facebookUrl).searchParams.get("u")).toContain("utm=facebook");
  });

  it("omits the caption entirely for an untitled kicker", () => {
    const links = shareLinks({
      title: "",
      description: "",
      url: `${ORIGIN}/?id=7`,
      image: "",
    });
    expect(new URL(links.twitterUrl).searchParams.get("text")).toBe("");
  });

  it("tags a url that carries no id without corrupting it", () => {
    const links = shareLinks(openGraphData(named, null, ORIGIN));
    expect(new URL(links.facebookUrl).searchParams.get("u")).toBe(
      `${ORIGIN}/?utm=facebook`,
    );
  });
});
