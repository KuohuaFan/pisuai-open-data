import { readFileSync } from "node:fs";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import { describe, expect, it } from "vitest";
import { buildCatalogIndex } from "../scripts/buildCatalogIndex";
import type { CatalogReleaseManifest } from "../scripts/catalogRelease";
import { CATALOG_STRIPPED_FIELDS } from "../shared/attribution";

const samplePath = fileURLToPath(
  new URL("../data/sample/gov-catalog-sample-100.csv", import.meta.url)
);
const manifestPath = fileURLToPath(
  new URL("../data/manifest.json", import.meta.url)
);
const noticePath = fileURLToPath(new URL("../data/NOTICE", import.meta.url));

const sample = parse(readFileSync(samplePath, "utf8"), {
  bom: true,
  columns: true,
  skip_empty_lines: true,
}) as Array<{
  資料集識別碼: string;
  資料集名稱: string;
  授權方式: string;
  更新頻率: string;
  提供機關: string;
  服務分類: string;
  提供機關聯絡人姓名: string;
  提供機關聯絡人電話: string;
}>;
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
  snapshotDate: string;
  rowCount: number;
  uniqueDatasetIds: number;
  sampleFile: string;
  sampleRowCount: number;
  sha256: string;
  strippedFields: string[];
};
const notice = readFileSync(noticePath, "utf8");

const requiredColumns = [
  "資料集識別碼",
  "資料集名稱",
  "授權方式",
  "更新頻率",
  "提供機關",
  "服務分類",
];

describe("catalog sample and manifest", () => {
  it("keeps 100 official rows and builds the layered index end to end", async () => {
    expect(sample).toHaveLength(100);
    expect(Object.keys(sample[0] ?? {})).toHaveLength(22);
    expect(
      requiredColumns.every(column =>
        Object.keys(sample[0] ?? {}).includes(column)
      )
    ).toBe(true);
    expect(new Set(sample.map(row => row.資料集識別碼)).size).toBe(100);
    expect(sample.every(row => row.授權方式.length > 0)).toBe(true);
    expect(
      sample.every(row =>
        CATALOG_STRIPPED_FIELDS.every(field => row[field] === "")
      )
    ).toBe(true);

    const outputDir = await mkdtemp(join(tmpdir(), "pisuods-sample-index-"));
    const generated = await buildCatalogIndex({
      csvPath: samplePath,
      outputDir,
      releaseManifest: JSON.parse(
        readFileSync(manifestPath, "utf8")
      ) as CatalogReleaseManifest,
      releaseTag: "catalog-2026-09-15",
      releaseUrl:
        "https://github.com/KuohuaFan/pisuai-open-data/releases/tag/catalog-2026-09-15",
      noticePath,
    });
    const generatedRecords = JSON.parse(
      await readFile(join(outputDir, "catalog.json"), "utf8")
    ) as Array<{ datasetId: string; officialPageUrl: string }>;
    expect(generated.totalDatasets).toBe(100);
    expect(generatedRecords).toHaveLength(100);
    expect(
      generatedRecords.every(
        row =>
          row.officialPageUrl === `https://data.gov.tw/dataset/${row.datasetId}`
      )
    ).toBe(true);
    expect(await readFile(join(outputDir, "index.md"), "utf8")).toContain(
      "政府資料全集 metadata 層"
    );
  });

  it("records the verified first snapshot and upstream-data notice", () => {
    expect(manifest).toMatchObject({
      snapshotDate: "2026-09-15",
      rowCount: 53169,
      uniqueDatasetIds: 53169,
      sampleFile: "sample/gov-catalog-sample-100.csv",
      sampleRowCount: 100,
      strippedFields: [...CATALOG_STRIPPED_FIELDS],
    });
    expect(manifest.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(notice).toContain("不適用 repository 根目錄的 MIT License");
    expect(notice).toContain("評律數位科技股份有限公司");
    expect(notice).toContain("提供機關聯絡人姓名");
    expect(notice).toContain("提供機關聯絡人電話");
    expect(notice).toContain(
      "資料來源：政府資料開放平臺（data.gov.tw），依政府資料開放授權條款第 1 版利用；快照日期 2026-09-15"
    );
  });
});
