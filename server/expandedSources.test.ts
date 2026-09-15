import { describe, expect, it } from "vitest";
import { expandedSources } from "../scripts/expandedSources";

describe("expanded source registry", () => {
  it("contains exactly the fourteen requested source areas with unique slugs", () => {
    expect(expandedSources).toHaveLength(14);
    expect(new Set(expandedSources.map(source => source.slug)).size).toBe(14);
  });

  it("stores canonical HTTPS sources and complete governance metadata", () => {
    for (const source of expandedSources) {
      expect(source.sourceUrl).toMatch(/^https:\/\//);
      expect(source.description.length).toBeGreaterThan(30);
      expect(source.dataLicense.length).toBeGreaterThan(5);
      expect(source.riskNote.length).toBeGreaterThan(20);
      expect(source.attribution.length).toBeGreaterThan(10);
    }
  });

  it("does not classify sensitive judicial, medical, labor, political or company graph sources as unrestricted", () => {
    const sensitive = expandedSources.filter(source =>
      [
        "mohw-open-data",
        "campaign-finance-digitalization",
        "taiwan-company-graph",
        "judicial-ip-commercial-judgments",
        "legislative-ivod-transcripts",
        "mol-labor-law-violations",
      ].includes(source.slug),
    );
    expect(sensitive).toHaveLength(6);
    for (const source of sensitive) expect(source.rightsClass).not.toBe("A");
  });

  it("records verified corrections for invalid or missing user-provided URLs", () => {
    expect(expandedSources.find(source => source.slug === "moi-real-price-open-data")?.sourceUrl).toBe(
      "https://plvr.land.moi.gov.tw/DownloadOpenData",
    );
    expect(expandedSources.find(source => source.slug === "campaign-finance-digitalization")?.repoUrl).toBe(
      "https://github.com/ronnywang/tw-campaign-finance",
    );
    expect(expandedSources.find(source => source.slug === "taiwan-company-graph")?.repoUrl).toBe(
      "https://github.com/ronnywang/company-graph",
    );
    expect(expandedSources.find(source => source.slug === "legislative-ivod-transcripts")?.repoUrl).toBeNull();
  });
});
