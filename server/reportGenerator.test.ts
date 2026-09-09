import { describe, expect, it } from "vitest";
import { deterministicDraft } from "./reportGenerator";

describe("deterministicDraft", () => {
  it("keeps every supplied source visible in the review draft", () => {
    const draft = deterministicDraft(["來源甲", "來源乙", "來源丙"]);
    expect(draft.body).toContain("1. 來源甲");
    expect(draft.body).toContain("2. 來源乙");
    expect(draft.body).toContain("3. 來源丙");
    expect(draft.body).toContain("待審草稿");
  });

  it("never represents the fallback draft as automatically published", () => {
    const draft = deterministicDraft(["來源甲", "來源乙"]);
    expect(draft.body).toContain("未經編輯核准前不會自動公開");
    expect(draft.title.length).toBeGreaterThan(10);
    expect(draft.topic).toBe("資料治理");
  });
});
