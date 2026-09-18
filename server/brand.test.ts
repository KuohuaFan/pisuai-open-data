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
    expect(HOME_TITLE).toBe(
      "PiSuODS｜PiSuAI 紫鳥貔貅・臺灣開放資料與深度報導平台"
    );
    expect(HOME_TITLE).toContain(BRAND.shortName);
    expect(HOME_TITLE).toContain(BRAND.subtitle);
    expect(HOME_DESCRIPTION).toBe(
      "PiSuAI 產品線中的臺灣開放資料平台，以來源追溯、再利用治理分類與人工發布閘門為核心；程式碼 MIT 開源。"
    );
    expect(HOME_KEYWORDS).toContain(BRAND.name);
  });
});
