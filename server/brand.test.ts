import { describe, expect, it } from "vitest";
import { BRAND } from "../shared/brand";
import { HOME_DESCRIPTION, HOME_KEYWORDS, HOME_TITLE } from "../shared/homeSeo";

describe("PiSuAI brand configuration", () => {
  it("uses the approved public brand name", () => {
    expect(BRAND.name).toBe("PiSuAI|紫鳥貔貅");
    expect(BRAND.shortName).toBe("PiSuAI");
    expect(BRAND.subtitle).toBe("紫鳥貔貅");
  });

  it("uses the uploaded WebDev logo path", () => {
    expect(BRAND.logoPath).toMatch(
      /^\/manus-storage\/pisuai-purple-bird-logo_[a-f0-9]+\.webp$/
    );
  });

  it("keeps homepage SEO aligned with the brand", () => {
    expect(HOME_TITLE.startsWith(BRAND.name)).toBe(true);
    expect(HOME_DESCRIPTION.startsWith(BRAND.name)).toBe(true);
    expect(HOME_KEYWORDS).toContain(BRAND.name);
  });
});
