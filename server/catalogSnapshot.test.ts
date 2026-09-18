import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parse } from "csv-parse/sync";
import { describe, expect, it, vi } from "vitest";
import {
  compareManifestRowCount,
  createCatalogSnapshotAssets,
  inspectCatalogCsv,
  verifySnapshotChecksum,
} from "../scripts/catalogSnapshot";
import { catalogReleaseManifestSchema } from "../scripts/catalogRelease";
import { sanitizeCatalogCsv } from "../scripts/sanitizeCatalogCsv";
import { CATALOG_STRIPPED_FIELDS } from "../shared/attribution";

const COLUMNS = [
  "資料集識別碼",
  "資料集名稱",
  "資料提供屬性",
  "服務分類",
  "品質檢測",
  "檔案格式",
  "資料下載網址",
  "編碼格式",
  "資資料集上架方式",
  "資料集描述",
  "主要欄位說明",
  "提供機關",
  "更新頻率",
  "授權方式",
  "相關網址",
  "計費方式",
  "提供機關聯絡人姓名",
  "提供機關聯絡人電話",
  "上架日期",
  "詮釋資料更新時間",
  "備註",
  "資料量",
];

function csvLine(values: Record<string, string>) {
  return COLUMNS.map(
    column => `"${(values[column] ?? "").replaceAll('"', '""')}"`
  ).join(",");
}

const RAW_SAMPLE = [
  COLUMNS.map(column => `"${column}"`).join(","),
  csvLine({
    資料集識別碼: "1",
    資料集名稱: "資料甲",
    服務分類: "公共資訊",
    提供機關: "機關甲",
    授權方式: "政府資料開放授權條款-第1版",
    更新頻率: "每日",
    提供機關聯絡人姓名: "承辦人甲",
    提供機關聯絡人電話: "02-1111-1111",
  }),
  csvLine({
    資料集識別碼: "2",
    資料集名稱: "資料乙",
    服務分類: "交通及通訊",
    提供機關: "機關乙",
    授權方式: "CC0",
    更新頻率: "每月",
    提供機關聯絡人姓名: "承辦人乙",
    提供機關聯絡人電話: "02-2222-2222",
  }),
].join("\n");

describe("catalog snapshot assets", () => {
  it("preserves the 22-column header and strips both contact fields", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pisuods-snapshot-"));
    const rawCsv = join(dir, "catalog.raw.csv");
    const csv = join(dir, "catalog.csv");
    await writeFile(rawCsv, `${RAW_SAMPLE}\n`, "utf8");

    const sanitized = await sanitizeCatalogCsv(rawCsv, csv);
    expect(sanitized).toMatchObject({
      rowCount: 2,
      columnCount: 22,
      strippedFields: [...CATALOG_STRIPPED_FIELDS],
      clearedValues: {
        提供機關聯絡人姓名: 2,
        提供機關聯絡人電話: 2,
      },
    });
    const records = parse(await readFile(csv, "utf8"), {
      columns: true,
      skip_empty_lines: true,
    }) as Array<Record<string, string>>;
    expect(Object.keys(records[0] ?? {})).toEqual(COLUMNS);
    expect(
      records.every(record =>
        CATALOG_STRIPPED_FIELDS.every(field => record[field] === "")
      )
    ).toBe(true);
    await expect(inspectCatalogCsv(csv)).resolves.toEqual({
      rowCount: 2,
      uniqueDatasetIds: 2,
    });
    await expect(inspectCatalogCsv(rawCsv)).rejects.toThrow(
      "Catalog privacy validation failed"
    );
  });

  it("creates a redacted manifest and rejects a tampered checksum", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pisuods-snapshot-"));
    const rawCsv = join(dir, "catalog.raw.csv");
    const csv = join(dir, "catalog.csv");
    const out = join(dir, "out");
    await writeFile(rawCsv, `${RAW_SAMPLE}\n`, "utf8");
    await sanitizeCatalogCsv(rawCsv, csv);
    const result = await createCatalogSnapshotAssets(
      csv,
      "2026-09-15",
      out,
      "0123456789abcdef"
    );

    expect(result.manifest).toMatchObject({
      snapshotDate: "2026-09-15",
      rowCount: 2,
      uniqueDatasetIds: 2,
      publisher: "評律數位科技股份有限公司",
      strippedFields: [...CATALOG_STRIPPED_FIELDS],
    });
    expect(catalogReleaseManifestSchema.parse(result.manifest)).toEqual(
      result.manifest
    );
    await expect(
      verifySnapshotChecksum(result.assetPath, result.checksumPath)
    ).resolves.toBe(result.manifest.sha256);

    await writeFile(result.assetPath, "tampered", "utf8");
    await expect(
      verifySnapshotChecksum(result.assetPath, result.checksumPath)
    ).rejects.toThrow("SHA-256 mismatch");
    expect(JSON.parse(await readFile(result.manifestPath, "utf8"))).toEqual(
      result.manifest
    );
  });

  it("warns when a release manifest count differs from imported rows", () => {
    const warn = vi.fn();
    expect(compareManifestRowCount(2, 1, warn)).toBe(false);
    expect(warn).toHaveBeenCalledOnce();
    expect(compareManifestRowCount(2, 2, warn)).toBe(true);
  });
});
