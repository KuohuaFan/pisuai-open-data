import { describe, expect, it } from "vitest";
import { governmentSpecializedSources } from "../scripts/governmentSpecializedSources";

describe("government specialized source registry", () => {
  it("contains six nationwide specialist portals and all six municipality portals", () => {
    expect(governmentSpecializedSources).toHaveLength(12);
    expect(governmentSpecializedSources.filter(source => source.category === "政府專業資料平臺")).toHaveLength(6);
    expect(governmentSpecializedSources.filter(source => source.category === "地方政府資料平臺")).toHaveLength(6);
  });

  it("uses unique canonical HTTPS URLs and complete governance fields", () => {
    expect(new Set(governmentSpecializedSources.map(source => source.slug)).size).toBe(12);
    for (const source of governmentSpecializedSources) {
      expect(source.sourceUrl).toMatch(/^https:\/\//);
      expect(source.description.length).toBeGreaterThan(20);
      expect(source.riskNote.length).toBeGreaterThan(20);
      expect(source.attribution.length).toBeGreaterThan(10);
    }
  });

  it("does not mark uncertain or sensitive specialist platforms as unrestricted", () => {
    for (const slug of ["nhi-open-data-api", "fsc-statistics-api", "nlsc-map-service-cloud", "pcc-public-construction-api", "kaohsiung-open-data"]) {
      expect(governmentSpecializedSources.find(source => source.slug === slug)?.rightsClass).not.toBe("A");
    }
  });
});
