import { mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MAX_MARKDOWN_PAGE_BYTES,
  buildCatalogIndex,
  paginateMarkdownEntries,
  parseCatalogIndexCsv,
} from "../scripts/buildCatalogIndex";
import type { CatalogReleaseManifest } from "../scripts/catalogRelease";
import { updatePagesCatalogMetadata } from "../scripts/updatePagesCatalogMetadata";

const manifest: CatalogReleaseManifest = {
  snapshotDate: "2026-09-15",
  rowCount: 3,
  uniqueDatasetIds: 3,
  sha256: "a".repeat(64),
  sourceUrl: "https://data.gov.tw/api/v2/rest/dataset/export",
  sourcePage: "https://data.gov.tw/dataset/6564",
  license: {
    name: "政府資料開放授權條款第 1 版",
    url: "https://data.gov.tw/license",
  },
  attribution:
    "資料來源：政府資料開放平臺（data.gov.tw），依政府資料開放授權條款第 1 版利用；快照日期 2026-09-15；本索引為 metadata 再整理，非原始資料，亦非經人工查核之來源卡。",
  publisher: "評律數位科技股份有限公司",
  publisherDisplay:
    "評律數位科技股份有限公司（PingLex Digital Technology Co., Ltd.）",
  strippedFields: ["提供機關聯絡人姓名", "提供機關聯絡人電話"],
  generatorCommit: "0123456789abcdef",
  asset: "gov-catalog-snapshot-2026-09-15.csv.gz",
};

const CSV = [
  '"資料集識別碼","資料集名稱","服務分類","提供機關","授權方式","更新頻率"',
  '"1","甲資料","公共資訊、交通及通訊","甲機關","政府資料開放授權條款-第1版","每日"',
  '"2","乙資料","公共資訊","甲機關","CC0","每月"',
  '"3","丙資料","交通及通訊","乙機關","CC BY 4.0","每年"',
].join("\n");

describe("catalog index builder", () => {
  it("updates the Pages catalog totals without hard-coding workflow output", () => {
    const html =
      '<strong data-catalog-total>0</strong><strong data-catalog-total>0</strong><strong data-catalog-agencies>0</strong><div class="registry-stamp" data-catalog-snapshot>old</div>';
    const updated = updatePagesCatalogMetadata(html, {
      snapshotDate: "2026-09-15",
      totalDatasets: 53169,
      categoryCount: 18,
      agencyCount: 800,
      categoryAssignments: 53169,
      releaseTag: "catalog-2026-09-15",
      releaseUrl: "https://example.test/release",
      releaseManifestUrl: "https://example.test/manifest.json",
      sourceManifestSha256: "a".repeat(64),
      attribution: "test",
      generatedAt: "2026-09-15T00:00:00.000Z",
    });
    expect(updated.match(/53,169/g)).toHaveLength(2);
    expect(updated).toContain("data-catalog-agencies>800</strong>");
    expect(updated).toContain(
      "data-catalog-snapshot>2026-09-15 snapshot</div>"
    );
  });

  it("keeps dataset IDs unique while allowing cross-category placement", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pisuods-catalog-index-"));
    const csv = join(dir, "catalog.csv");
    await writeFile(csv, `${CSV}\n`, "utf8");
    const records = await parseCatalogIndexCsv(csv);
    expect(records.map(record => record.datasetId)).toEqual(["1", "2", "3"]);
    expect(records[0].categories).toEqual(["交通及通訊", "公共資訊"]);
  });

  it("splits Markdown pages below 400 KB with a fixed header on every page", () => {
    const entries = Array.from(
      { length: 900 },
      (_, index) => `- ${index} ${"測試內容".repeat(80)}`
    );
    const pages = paginateMarkdownEntries(
      entries,
      (pageEntries, page, total) =>
        `快照日期：2026-09-15\n本頁筆數：${pageEntries.length}\n顯名聲明\nmetadata 層，非治理來源庫\n\n# 測試 ${page}/${total}\n\n${pageEntries.join("\n")}\n`
    );
    expect(pages.length).toBeGreaterThan(1);
    for (const page of pages) {
      expect(Buffer.byteLength(page, "utf8")).toBeLessThanOrEqual(
        MAX_MARKDOWN_PAGE_BYTES
      );
      expect(page).toContain("快照日期：2026-09-15");
      expect(page).toContain("本頁筆數：");
      expect(page).toContain("metadata 層，非治理來源庫");
    }
  });

  it("writes three-level Markdown and HTML indexes with dataset links", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pisuods-catalog-index-"));
    const csv = join(dir, "catalog.csv");
    const notice = join(dir, "NOTICE");
    const output = join(dir, "catalog");
    await writeFile(csv, `${CSV}\n`, "utf8");
    await writeFile(notice, "Upstream data notice\n", "utf8");

    const result = await buildCatalogIndex({
      csvPath: csv,
      outputDir: output,
      releaseManifest: manifest,
      releaseTag: "catalog-2026-09-15",
      releaseUrl:
        "https://github.com/KuohuaFan/pisuai-open-data/releases/tag/catalog-2026-09-15",
      noticePath: notice,
      generatedAt: "2026-09-15T00:00:00.000Z",
    });

    expect(result).toMatchObject({
      totalDatasets: 3,
      categoryCount: 2,
      agencyCount: 2,
    });
    const root = await readFile(join(output, "index.md"), "utf8");
    expect(root).toContain("c01-public-information");
    expect(root).toContain("c04-transport-communications");
    const category = await readFile(
      join(output, "c01-public-information", "index.md"),
      "utf8"
    );
    expect(category).toContain("甲機關");
    const agencyDir = category.match(/\.\/(a[a-f0-9]{8})\//)?.[1];
    expect(agencyDir).toBeTruthy();
    const agency = await readFile(
      join(output, "c01-public-information", agencyDir!, "index.md"),
      "utf8"
    );
    expect(agency).toContain("https://data.gov.tw/dataset/1");
    expect(agency).toContain(
      "https://github.com/KuohuaFan/pisuai-open-data/releases/tag/catalog-2026-09-15"
    );
    expect(agency).toContain("| 名稱 | 官方頁 URL | 授權 | 更新頻率 |");
    expect((await stat(join(output, "index.md"))).size).toBeLessThanOrEqual(
      MAX_MARKDOWN_PAGE_BYTES
    );
  });
});
