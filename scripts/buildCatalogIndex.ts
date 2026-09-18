import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { parse } from "csv-parse";
import {
  catalogReleaseManifestSchema,
  type CatalogReleaseManifest,
} from "./catalogRelease";

export const MAX_MARKDOWN_PAGE_BYTES = 400 * 1024;
const PAGE_NAV_RESERVE_BYTES = 8 * 1024;
const DISCLAIMER =
  "本索引屬政府資料全集 metadata 層，非治理來源庫；再利用前請回到官方頁核對授權";

const CATEGORY_SLUGS = new Map<string, string>([
  ["公共資訊", "c01-public-information"],
  ["生活安全及品質", "c02-living-safety"],
  ["購屋及遷徙", "c03-housing-migration"],
  ["交通及通訊", "c04-transport-communications"],
  ["投資理財", "c05-investment-finance"],
  ["休閒旅遊", "c06-leisure-tourism"],
  ["開創事業", "c07-business-startup"],
  ["就醫", "c08-healthcare"],
  ["求學及進修", "c09-education"],
  ["求職及就業", "c10-employment"],
  ["老年安養", "c11-elder-care"],
  ["服兵役", "c12-military-service"],
  ["生育保健", "c13-maternity-health"],
  ["選舉及投票", "c14-elections-voting"],
  ["生命禮儀", "c15-life-ceremonies"],
  ["出生及收養", "c16-birth-adoption"],
  ["婚姻", "c17-marriage"],
  ["退休", "c18-retirement"],
]);

export type CatalogIndexRecord = {
  datasetId: string;
  name: string;
  officialPageUrl: string;
  license: string;
  updateFrequency: string;
  publisher: string;
  categories: string[];
};

export type CatalogIndexManifest = {
  snapshotDate: string;
  totalDatasets: number;
  categoryCount: number;
  agencyCount: number;
  categoryAssignments: number;
  releaseTag: string;
  releaseUrl: string;
  releaseManifestUrl: string;
  sourceManifestSha256: string;
  attribution: string;
  generatedAt: string;
};

function compareText(a: string, b: string) {
  return a === b ? 0 : a < b ? -1 : 1;
}

function clean(value: unknown, fallback = "未提供") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function escapeMarkdown(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function splitCategories(value: unknown) {
  return Array.from(
    new Set(
      String(value ?? "未分類")
        .split(/[、,，;；|]/)
        .map(item => item.trim())
        .filter(Boolean)
    )
  ).sort(compareText);
}

function agencySlug(name: string) {
  return `a${createHash("sha1").update(name).digest("hex").slice(0, 8)}`;
}

export function categorySlug(name: string) {
  const slug = CATEGORY_SLUGS.get(name);
  if (!slug)
    throw new Error(`No deterministic category slug mapping for: ${name}`);
  return slug;
}

export async function parseCatalogIndexCsv(path: string) {
  const records = new Map<string, CatalogIndexRecord>();
  const parser = createReadStream(path).pipe(
    parse({
      bom: true,
      columns: true,
      relax_quotes: true,
      relax_column_count: true,
      skip_empty_lines: true,
    })
  );

  for await (const raw of parser) {
    const row = raw as Record<string, unknown>;
    const datasetId = clean(row["資料集識別碼"], "");
    const name = clean(row["資料集名稱"], "");
    const publisher = clean(row["提供機關"], "");
    if (!datasetId || !name || !publisher) continue;
    const categories = splitCategories(row["服務分類"]);
    const existing = records.get(datasetId);
    if (existing) {
      existing.categories = Array.from(
        new Set([...existing.categories, ...categories])
      ).sort(compareText);
      continue;
    }
    records.set(datasetId, {
      datasetId,
      name,
      officialPageUrl: `https://data.gov.tw/dataset/${encodeURIComponent(datasetId)}`,
      license: clean(row["授權方式"]),
      updateFrequency: clean(row["更新頻率"]),
      publisher,
      categories,
    });
  }

  return Array.from(records.values()).sort(
    (a, b) =>
      compareText(a.datasetId, b.datasetId) || compareText(a.name, b.name)
  );
}

function fixedHeader(
  manifest: CatalogReleaseManifest,
  pageCount: number,
  releaseUrl: string
) {
  return [
    `快照日期：${manifest.snapshotDate}`,
    `本頁筆數：${pageCount.toLocaleString("en-US")}`,
    `Release：[catalog-${manifest.snapshotDate}](${releaseUrl})`,
    manifest.attribution,
    DISCLAIMER,
  ].join("\n");
}

export function paginateMarkdownEntries(
  entries: string[],
  renderPage: (
    pageEntries: string[],
    page: number,
    totalPages: number
  ) => string,
  maxBytes = MAX_MARKDOWN_PAGE_BYTES
) {
  if (entries.length === 0) return [renderPage([], 1, 1)];
  const chunks: string[][] = [];
  let current: string[] = [];
  const contentLimit = maxBytes - PAGE_NAV_RESERVE_BYTES;

  for (const entry of entries) {
    const candidate = [...current, entry];
    if (
      current.length > 0 &&
      Buffer.byteLength(renderPage(candidate, 1, 1), "utf8") > contentLimit
    ) {
      chunks.push(current);
      current = [entry];
    } else {
      current = candidate;
    }
  }
  if (current.length) chunks.push(current);

  const pages = chunks.map((chunk, index) =>
    renderPage(chunk, index + 1, chunks.length)
  );
  for (const [index, page] of pages.entries()) {
    const size = Buffer.byteLength(page, "utf8");
    if (size > maxBytes)
      throw new Error(
        `Generated Markdown page ${index + 1} is ${size} bytes; limit is ${maxBytes}`
      );
  }
  return pages;
}

function pageNavigation(totalPages: number, currentPage: number) {
  if (totalPages <= 1) return "";
  const links = Array.from({ length: totalPages }, (_, index) => {
    const page = index + 1;
    const path = page === 1 ? "index.md" : `page-${page}.md`;
    return page === currentPage ? `**${page}**` : `[${page}](${path})`;
  });
  return `頁次：${links.join(" · ")}`;
}

function markdownDocument(
  manifest: CatalogReleaseManifest,
  title: string,
  breadcrumbs: string,
  entries: string[],
  page: number,
  totalPages: number,
  releaseUrl: string,
  pageCount = entries.length
) {
  const nav = pageNavigation(totalPages, page);
  return `${fixedHeader(manifest, pageCount, releaseUrl)}\n\n${breadcrumbs}\n\n# ${escapeMarkdown(title)}\n\n${nav ? `${nav}\n\n` : ""}${entries.join("\n")}\n`;
}

function htmlShell(title: string, body: string) {
  return `<!doctype html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}｜PiSuODS 政府資料目錄索引</title>
  <style>
    :root{color-scheme:light;--ink:#09252d;--paper:#f7f1e5;--gold:#9a6d22;--line:#d7cfbf}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:system-ui,-apple-system,"Noto Sans TC",sans-serif;line-height:1.65}main{max-width:1100px;margin:auto;padding:32px 20px 72px}a{color:#075f68;text-underline-offset:3px}.meta{border:1px solid var(--line);padding:16px;background:#fffaf0}.crumbs,.pagination{margin:20px 0}h1{font-family:serif;font-size:clamp(2rem,5vw,4rem);line-height:1.1}table{width:100%;border-collapse:collapse;background:#fff}th,td{border:1px solid var(--line);padding:10px;text-align:left;vertical-align:top}li{margin:.45rem 0}@media(max-width:720px){table{display:block;overflow-x:auto}main{padding:24px 14px}}
  </style>
</head>
<body><main>${body}</main></body>
</html>\n`;
}

function htmlMeta(
  manifest: CatalogReleaseManifest,
  pageCount: number,
  releaseUrl: string
) {
  return `<div class="meta"><div>快照日期：${escapeHtml(manifest.snapshotDate)}</div><div>本頁筆數：${pageCount.toLocaleString("en-US")}</div><div>Release：<a href="${escapeHtml(releaseUrl)}">catalog-${escapeHtml(manifest.snapshotDate)}</a></div><div>${escapeHtml(manifest.attribution)}</div><div>${escapeHtml(DISCLAIMER)}</div></div>`;
}

async function writePaginated(
  dir: string,
  manifest: CatalogReleaseManifest,
  title: string,
  breadcrumbs: string,
  htmlBreadcrumbs: string,
  markdownEntries: string[],
  htmlEntries: string[],
  htmlAsTable: boolean,
  releaseUrl: string
) {
  await mkdir(dir, { recursive: true });
  const pages = paginateMarkdownEntries(
    markdownEntries,
    (entries, page, totalPages) =>
      markdownDocument(
        manifest,
        title,
        breadcrumbs,
        htmlAsTable && entries.length
          ? [
              "| 名稱 | 官方頁 URL | 授權 | 更新頻率 |\n| --- | --- | --- | --- |",
              ...entries,
            ]
          : entries,
        page,
        totalPages,
        releaseUrl,
        entries.length
      )
  );
  const pageChunks: string[][] = [];
  let cursor = 0;
  for (const page of pages) {
    const countMatch = page.match(/^本頁筆數：([\d,]+)/m);
    const count = Number((countMatch?.[1] ?? "0").replaceAll(",", ""));
    pageChunks.push(htmlEntries.slice(cursor, cursor + count));
    cursor += count;
  }

  for (const [index, markdown] of pages.entries()) {
    const page = index + 1;
    const markdownName = page === 1 ? "index.md" : `page-${page}.md`;
    const htmlName = page === 1 ? "index.html" : `page-${page}.html`;
    await writeFile(join(dir, markdownName), markdown, "utf8");
    const nav =
      pages.length > 1
        ? `<nav class="pagination">頁次：${pages
            .map((_, itemIndex) => {
              const itemPage = itemIndex + 1;
              const href =
                itemPage === 1 ? "index.html" : `page-${itemPage}.html`;
              return itemPage === page
                ? `<strong>${itemPage}</strong>`
                : `<a href="${href}">${itemPage}</a>`;
            })
            .join(" · ")}</nav>`
        : "";
    const items = pageChunks[index];
    const rendered = htmlAsTable
      ? `<table><thead><tr><th>名稱</th><th>官方頁 URL</th><th>授權</th><th>更新頻率</th></tr></thead><tbody>${items.join("")}</tbody></table>`
      : `<ul>${items.join("")}</ul>`;
    await writeFile(
      join(dir, htmlName),
      htmlShell(
        title,
        `${htmlMeta(manifest, items.length, releaseUrl)}<nav class="crumbs">${htmlBreadcrumbs}</nav><h1>${escapeHtml(title)}</h1>${nav}${rendered}${nav}`
      ),
      "utf8"
    );
  }
}

export async function buildCatalogIndex(input: {
  csvPath: string;
  outputDir: string;
  releaseManifest: CatalogReleaseManifest;
  releaseTag: string;
  releaseUrl: string;
  noticePath: string;
  generatedAt?: string;
}) {
  const {
    csvPath,
    outputDir,
    releaseManifest,
    releaseTag,
    releaseUrl,
    noticePath,
  } = input;
  const records = await parseCatalogIndexCsv(csvPath);
  const categories = Array.from(
    new Set(records.flatMap(record => record.categories))
  ).sort(compareText);
  if (categories.some(category => !CATEGORY_SLUGS.has(category))) {
    throw new Error(
      `Unmapped service categories: ${categories.filter(category => !CATEGORY_SLUGS.has(category)).join(", ")}`
    );
  }
  const categoryInfo = categories.map(name => ({
    name,
    slug: categorySlug(name),
  }));
  const agencies = new Set(records.map(record => record.publisher));
  const rootEntries: string[] = [];
  const rootHtmlEntries: string[] = [];

  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  for (const category of categoryInfo) {
    const categoryRecords = records.filter(record =>
      record.categories.includes(category.name)
    );
    rootEntries.push(
      `- [${escapeMarkdown(category.name)}](./${category.slug}/) — ${categoryRecords.length.toLocaleString("en-US")} 筆`
    );
    rootHtmlEntries.push(
      `<li><a href="./${category.slug}/">${escapeHtml(category.name)}</a> — ${categoryRecords.length.toLocaleString("en-US")} 筆</li>`
    );

    const byAgency = new Map<string, CatalogIndexRecord[]>();
    for (const record of categoryRecords) {
      const group = byAgency.get(record.publisher) ?? [];
      group.push(record);
      byAgency.set(record.publisher, group);
    }
    const agencyEntries = Array.from(byAgency.entries()).sort(([a], [b]) =>
      compareText(a, b)
    );
    const categoryMarkdownEntries: string[] = [];
    const categoryHtmlEntries: string[] = [];
    for (const [agency, agencyRecords] of agencyEntries) {
      const slug = agencySlug(agency);
      categoryMarkdownEntries.push(
        `- [${escapeMarkdown(agency)}](./${slug}/) — ${agencyRecords.length.toLocaleString("en-US")} 筆`
      );
      categoryHtmlEntries.push(
        `<li><a href="./${slug}/">${escapeHtml(agency)}</a> — ${agencyRecords.length.toLocaleString("en-US")} 筆</li>`
      );
      const rows = agencyRecords.sort(
        (a, b) =>
          compareText(a.name, b.name) || compareText(a.datasetId, b.datasetId)
      );
      const markdownRows = rows.map(
        record =>
          `| ${escapeMarkdown(record.name)} | [官方頁](${record.officialPageUrl}) | ${escapeMarkdown(record.license)} | ${escapeMarkdown(record.updateFrequency)} |`
      );
      const rowEntries = markdownRows.map(row => `${row}\n`);
      const htmlRows = rows.map(
        record =>
          `<tr><td>${escapeHtml(record.name)}</td><td><a href="${escapeHtml(record.officialPageUrl)}">官方頁</a></td><td>${escapeHtml(record.license)}</td><td>${escapeHtml(record.updateFrequency)}</td></tr>`
      );
      await writePaginated(
        join(outputDir, category.slug, slug),
        releaseManifest,
        agency,
        `[政府資料目錄索引](../../index.md) / [${escapeMarkdown(category.name)}](../index.md) / ${escapeMarkdown(agency)}`,
        `<a href="../../index.html">政府資料目錄索引</a> / <a href="../index.html">${escapeHtml(category.name)}</a> / ${escapeHtml(agency)}`,
        rowEntries,
        htmlRows,
        true,
        releaseUrl
      );
    }

    await writePaginated(
      join(outputDir, category.slug),
      releaseManifest,
      category.name,
      `[政府資料目錄索引](../index.md) / ${escapeMarkdown(category.name)}`,
      `<a href="../index.html">政府資料目錄索引</a> / ${escapeHtml(category.name)}`,
      categoryMarkdownEntries,
      categoryHtmlEntries,
      false,
      releaseUrl
    );
    await writeFile(
      join(outputDir, category.slug, `${category.slug}.json`),
      `${JSON.stringify(categoryRecords, null, 2)}\n`,
      "utf8"
    );
  }

  await writePaginated(
    outputDir,
    releaseManifest,
    "政府資料目錄索引",
    "[PiSuODS 專案首頁](../index.html) / 政府資料目錄索引",
    '<a href="../index.html">PiSuODS 專案首頁</a> / 政府資料目錄索引',
    rootEntries,
    rootHtmlEntries,
    false,
    releaseUrl
  );
  await writeFile(
    join(outputDir, "NOTICE"),
    await readFile(noticePath, "utf8"),
    "utf8"
  );
  await writeFile(
    join(outputDir, "catalog.json"),
    `${JSON.stringify(records, null, 2)}\n`,
    "utf8"
  );

  const manifest: CatalogIndexManifest = {
    snapshotDate: releaseManifest.snapshotDate,
    totalDatasets: records.length,
    categoryCount: categories.length,
    agencyCount: agencies.size,
    categoryAssignments: records.reduce(
      (sum, record) => sum + record.categories.length,
      0
    ),
    releaseTag,
    releaseUrl,
    releaseManifestUrl: `${releaseUrl.replace("/releases/tag/", "/releases/download/")}/manifest.json`,
    sourceManifestSha256: releaseManifest.sha256,
    attribution: releaseManifest.attribution,
    generatedAt:
      input.generatedAt ?? `${releaseManifest.snapshotDate}T00:00:00.000+08:00`,
  };
  await writeFile(
    join(outputDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );
  return manifest;
}

async function main() {
  const [csvPath, outputDir, manifestPath, noticePath, releaseTag, releaseUrl] =
    process.argv.slice(2);
  if (
    !csvPath ||
    !outputDir ||
    !manifestPath ||
    !noticePath ||
    !releaseTag ||
    !releaseUrl
  ) {
    throw new Error(
      "Usage: buildCatalogIndex.ts <csv> <output-dir> <release-manifest.json> <notice> <release-tag> <release-url>"
    );
  }
  const releaseManifest = catalogReleaseManifestSchema.parse(
    JSON.parse(await readFile(resolve(manifestPath), "utf8"))
  );
  const result = await buildCatalogIndex({
    csvPath: resolve(csvPath),
    outputDir: resolve(outputDir),
    releaseManifest,
    releaseTag,
    releaseUrl,
    noticePath: resolve(noticePath),
  });
  console.log(JSON.stringify(result, null, 2));
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === resolve(new URL(import.meta.url).pathname)) {
  await main();
}
