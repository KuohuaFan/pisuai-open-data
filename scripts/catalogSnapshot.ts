import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";
import { parse } from "csv-parse";
import {
  CATALOG_LICENSE_NAME,
  CATALOG_LICENSE_URL,
  CATALOG_OFFICIAL_COLUMN_COUNT,
  CATALOG_PUBLISHER,
  CATALOG_PUBLISHER_BILINGUAL,
  CATALOG_STRIPPED_FIELDS,
  CATALOG_SOURCE_PAGE,
  CATALOG_SOURCE_URL,
  assertSnapshotDate,
  catalogAttribution,
} from "../shared/attribution";

export type CatalogSnapshotManifest = {
  snapshotDate: string;
  rowCount: number;
  uniqueDatasetIds: number;
  sha256: string;
  sourceUrl: string;
  sourcePage: string;
  license: { name: string; url: string };
  attribution: string;
  publisher: string;
  publisherDisplay: string;
  strippedFields: string[];
  generatorCommit: string;
  asset: string;
};

export async function inspectCatalogCsv(path: string) {
  let rowCount = 0;
  const ids = new Set<string>();
  let columns: string[] = [];
  const parser = createReadStream(path).pipe(
    parse({
      bom: true,
      columns: header => {
        columns = header.map((value: unknown) => String(value));
        if (columns.length !== CATALOG_OFFICIAL_COLUMN_COUNT) {
          throw new Error(
            `Expected ${CATALOG_OFFICIAL_COLUMN_COUNT} official catalog columns, received ${columns.length}`
          );
        }
        for (const field of CATALOG_STRIPPED_FIELDS) {
          if (!columns.includes(field)) {
            throw new Error(`Required contact field was not found: ${field}`);
          }
        }
        return columns;
      },
      relax_quotes: true,
      skip_empty_lines: true,
    })
  );

  for await (const raw of parser) {
    const row = raw as Record<string, unknown>;
    rowCount += 1;
    for (const field of CATALOG_STRIPPED_FIELDS) {
      if (String(row[field] ?? "").trim()) {
        throw new Error(
          `Catalog privacy validation failed: ${field} must be empty in row ${rowCount}`
        );
      }
    }
    const id = String(row["資料集識別碼"] ?? "").trim();
    if (id) ids.add(id);
  }

  if (rowCount === 0 || ids.size === 0) {
    throw new Error(
      `Catalog validation failed: rowCount=${rowCount}, uniqueDatasetIds=${ids.size}`
    );
  }

  return { rowCount, uniqueDatasetIds: ids.size };
}

export async function sha256File(path: string) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path))
    hash.update(chunk as Buffer);
  return hash.digest("hex");
}

export function parseSha256File(content: string) {
  const match = content.trim().match(/^([a-f0-9]{64})(?:\s+\*?(.+))?$/i);
  if (!match) throw new Error("Invalid SHA-256 checksum file");
  return { sha256: match[1].toLowerCase(), filename: match[2]?.trim() ?? null };
}

export async function verifySnapshotChecksum(
  assetPath: string,
  checksumPath: string
) {
  const expected = parseSha256File(await readFile(checksumPath, "utf8"));
  const actual = await sha256File(assetPath);
  if (actual !== expected.sha256) {
    throw new Error(
      `SHA-256 mismatch: expected ${expected.sha256}, received ${actual}`
    );
  }
  if (expected.filename && basename(assetPath) !== expected.filename) {
    throw new Error(
      `Checksum filename mismatch: expected ${expected.filename}, received ${basename(assetPath)}`
    );
  }
  return actual;
}

export function compareManifestRowCount(
  manifestCount: number,
  actualCount: number,
  warn = console.warn
) {
  if (manifestCount !== actualCount) {
    warn(
      `[CatalogRelease] Manifest rowCount ${manifestCount} differs from imported records ${actualCount}.`
    );
    return false;
  }
  return true;
}

export async function createCatalogSnapshotAssets(
  inputPath: string,
  snapshotDate: string,
  outputDir: string,
  generatorCommit: string
) {
  assertSnapshotDate(snapshotDate);
  if (!/^[a-f0-9]{7,40}$/i.test(generatorCommit)) {
    throw new Error("generatorCommit must be a Git commit SHA");
  }

  await mkdir(outputDir, { recursive: true });
  const stats = await inspectCatalogCsv(inputPath);
  const asset = `gov-catalog-snapshot-${snapshotDate}.csv.gz`;
  const assetPath = join(outputDir, asset);
  const checksumPath = join(
    outputDir,
    `gov-catalog-snapshot-${snapshotDate}.sha256`
  );
  const manifestPath = join(outputDir, "manifest.json");
  const notesPath = join(outputDir, "release-notes.md");

  await pipeline(
    createReadStream(inputPath),
    createGzip({ level: 9 }),
    createWriteStream(assetPath)
  );
  const sha256 = await sha256File(assetPath);
  await writeFile(checksumPath, `${sha256}  ${asset}\n`, "utf8");

  const manifest: CatalogSnapshotManifest = {
    snapshotDate,
    rowCount: stats.rowCount,
    uniqueDatasetIds: stats.uniqueDatasetIds,
    sha256,
    sourceUrl: CATALOG_SOURCE_URL,
    sourcePage: CATALOG_SOURCE_PAGE,
    license: { name: CATALOG_LICENSE_NAME, url: CATALOG_LICENSE_URL },
    attribution: catalogAttribution(snapshotDate),
    publisher: CATALOG_PUBLISHER,
    publisherDisplay: CATALOG_PUBLISHER_BILINGUAL,
    strippedFields: [...CATALOG_STRIPPED_FIELDS],
    generatorCommit,
    asset,
  };
  await writeFile(
    manifestPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );
  await writeFile(
    notesPath,
    [
      `# 政府資料目錄快照 ${snapshotDate}`,
      "",
      manifest.attribution,
      "",
      `- 資料列數：${manifest.rowCount.toLocaleString("en-US")}`,
      `- 唯一 datasetId：${manifest.uniqueDatasetIds.toLocaleString("en-US")}`,
      `- SHA-256：\`${manifest.sha256}\``,
      `- 整理與發布：${manifest.publisherDisplay}`,
      `- 已移除欄位：${manifest.strippedFields.join("、")}`,
      "",
      "此快照與衍生索引不適用本 repository 的 MIT License；各筆資料仍依其原始授權欄位及官方頁面所載條件利用。",
      "",
    ].join("\n"),
    "utf8"
  );

  return { manifest, assetPath, checksumPath, manifestPath, notesPath };
}
