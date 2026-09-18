import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const samplePath = fileURLToPath(
  new URL("../data/catalog-sample.json", import.meta.url)
);
const manifestPath = fileURLToPath(
  new URL("../data/manifest.json", import.meta.url)
);
const noticePath = fileURLToPath(new URL("../data/NOTICE", import.meta.url));

const sample = JSON.parse(readFileSync(samplePath, "utf8")) as Array<{
  datasetId: string;
  officialPageUrl: string;
  license: string;
}>;
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
  snapshotDate: string;
  rowCount: number;
  uniqueDatasetIds: number;
  sampleRowCount: number;
  sha256: string;
};
const notice = readFileSync(noticePath, "utf8");

describe("catalog sample and manifest", () => {
  it("keeps exactly 100 unique metadata sample rows with official links", () => {
    expect(sample).toHaveLength(100);
    expect(new Set(sample.map(row => row.datasetId)).size).toBe(100);
    expect(
      sample.every(
        row =>
          row.officialPageUrl === `https://data.gov.tw/dataset/${row.datasetId}`
      )
    ).toBe(true);
    expect(sample.every(row => row.license.length > 0)).toBe(true);
  });

  it("records the verified first snapshot and upstream-data notice", () => {
    expect(manifest).toMatchObject({
      snapshotDate: "2026-09-15",
      rowCount: 53169,
      uniqueDatasetIds: 53169,
      sampleRowCount: 100,
    });
    expect(manifest.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(notice).toContain("不適用 repository 根目錄的 MIT License");
    expect(notice).toContain("評律數位科技股份有限公司");
    expect(notice).toContain("數位發展部 2026");
  });
});
