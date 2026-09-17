import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  HOME_DESCRIPTION,
  HOME_KEYWORDS,
  HOME_KEYWORDS_CONTENT,
  HOME_TITLE,
  unicodeLength,
} from "../shared/homeSeo";

const indexPath = fileURLToPath(
  new URL("../client/index.html", import.meta.url)
);
const indexHtml = readFileSync(indexPath, "utf8");

function getStaticTitle() {
  return indexHtml
    .match(/<title>([\s\S]*?)<\/title>/i)?.[1]
    ?.replace(/\s+/g, " ")
    .trim();
}

function getStaticMetaContent(name: string) {
  const tags = indexHtml.match(/<meta\b[^>]*>/gi) ?? [];
  const tag = tags.find(candidate =>
    new RegExp(`name=["']${name}["']`, "i").test(candidate)
  );
  return tag?.match(/content=["']([^"']*)["']/i)?.[1];
}

describe("homepage SEO constraints", () => {
  it("keeps the title and description inside their strict character limits", () => {
    expect(unicodeLength(HOME_TITLE)).toBeGreaterThanOrEqual(30);
    expect(unicodeLength(HOME_TITLE)).toBeLessThanOrEqual(60);
    expect(unicodeLength(HOME_DESCRIPTION)).toBeGreaterThanOrEqual(50);
    expect(unicodeLength(HOME_DESCRIPTION)).toBeLessThanOrEqual(160);
  });

  it("keeps a focused set of three to eight keywords", () => {
    expect(HOME_KEYWORDS.length).toBeGreaterThanOrEqual(3);
    expect(HOME_KEYWORDS.length).toBeLessThanOrEqual(8);
    expect(HOME_KEYWORDS_CONTENT.split(",")).toHaveLength(HOME_KEYWORDS.length);
  });

  it("keeps the static crawler fallback synchronized", () => {
    expect(getStaticTitle()).toBe(HOME_TITLE);
    expect(getStaticMetaContent("description")).toBe(HOME_DESCRIPTION);
    expect(getStaticMetaContent("keywords")).toBe(HOME_KEYWORDS_CONTENT);
  });
});
