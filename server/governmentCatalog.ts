import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { parse } from "csv-parse";
import { governmentCatalogSyncs, governmentDatasets } from "../drizzle/schema";
import { getDb } from "./db";

export const NATIONAL_CATALOG_URL =
  "https://data.gov.tw/api/v2/rest/dataset/export";
export const NATIONAL_DELTA_URL =
  "https://data.gov.tw/api/front/dataset/changed/export";
const BATCH_SIZE = 100;

type GovernmentRow = Record<string, unknown>;
type NormalizedDataset = typeof governmentDatasets.$inferInsert;

function text(value: unknown, max?: number) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  return max ? normalized.slice(0, max) : normalized;
}

function parseTaipeiDate(value: unknown) {
  const raw =
    typeof value === "object" && value && "date" in value
      ? text((value as { date?: unknown }).date)
      : text(value);
  if (!raw) return null;
  const timestamp = Date.parse(
    raw.includes("T") ? raw : `${raw.replace(" ", "T")}+08:00`
  );
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function normalizeGovernmentRow(
  row: GovernmentRow,
  observedAt: number
): NormalizedDataset | null {
  const datasetId = text(row["資料集識別碼"], 40);
  const title = text(row["資料集名稱"], 500);
  const publisher = text(row["提供機關"], 240);
  if (!datasetId || !title || !publisher) return null;
  const statusText = text(row["資料集變動狀態"]);
  const status = statusText?.includes("下架")
    ? ("withdrawn" as const)
    : ("active" as const);
  const rawHash = createHash("sha256")
    .update(JSON.stringify(row))
    .digest("hex");

  return {
    datasetId,
    title,
    dataProperty: text(row["資料提供屬性"], 80),
    serviceCategory: text(row["服務分類"], 100) ?? "未分類",
    quality: text(row["品質檢測"], 40),
    formats: text(row["檔案格式"]),
    downloadUrls: text(row["資料下載網址"]),
    encodings: text(row["編碼格式"], 240),
    publicationMethod: text(
      row["資資料集上架方式"] ?? row["資料集上架方式"],
      120
    ),
    description: text(row["資料集描述"]),
    fieldDescription: text(row["主要欄位說明"]),
    publisher,
    updateFrequency: text(row["更新頻率"], 120),
    license: text(row["授權方式"], 200),
    relatedUrl: text(row["相關網址"]),
    cost: text(row["計費方式"], 80),
    issuedAt: parseTaipeiDate(row["上架日期"]),
    modifiedAt: parseTaipeiDate(row["詮釋資料更新時間"]),
    notes: text(row["備註"]),
    recordCountText: text(row["資料量"], 120),
    status,
    rawHash,
    firstSeenAt: observedAt,
    lastSeenAt: observedAt,
    updatedAt: observedAt,
  };
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db;
}

async function upsertBatch(rows: NormalizedDataset[]) {
  if (!rows.length) return 0;
  const db = await requireDb();
  const ids = rows.map(row => row.datasetId);
  const existing = await db
    .select({
      datasetId: governmentDatasets.datasetId,
      rawHash: governmentDatasets.rawHash,
      status: governmentDatasets.status,
    })
    .from(governmentDatasets)
    .where(inArray(governmentDatasets.datasetId, ids));
  const old = new Map(
    existing.map(row => [row.datasetId, `${row.rawHash}:${row.status}`])
  );
  const changed = rows.filter(
    row => old.get(row.datasetId) !== `${row.rawHash}:${row.status}`
  ).length;

  await db
    .insert(governmentDatasets)
    .values(rows)
    .onDuplicateKeyUpdate({
      set: {
        title: sql`VALUES(${governmentDatasets.title})`,
        dataProperty: sql`COALESCE(VALUES(${governmentDatasets.dataProperty}), ${governmentDatasets.dataProperty})`,
        serviceCategory: sql`VALUES(${governmentDatasets.serviceCategory})`,
        quality: sql`COALESCE(VALUES(${governmentDatasets.quality}), ${governmentDatasets.quality})`,
        formats: sql`COALESCE(VALUES(${governmentDatasets.formats}), ${governmentDatasets.formats})`,
        downloadUrls: sql`COALESCE(VALUES(${governmentDatasets.downloadUrls}), ${governmentDatasets.downloadUrls})`,
        encodings: sql`COALESCE(VALUES(${governmentDatasets.encodings}), ${governmentDatasets.encodings})`,
        publicationMethod: sql`COALESCE(VALUES(${governmentDatasets.publicationMethod}), ${governmentDatasets.publicationMethod})`,
        description: sql`COALESCE(VALUES(${governmentDatasets.description}), ${governmentDatasets.description})`,
        fieldDescription: sql`COALESCE(VALUES(${governmentDatasets.fieldDescription}), ${governmentDatasets.fieldDescription})`,
        publisher: sql`VALUES(${governmentDatasets.publisher})`,
        updateFrequency: sql`COALESCE(VALUES(${governmentDatasets.updateFrequency}), ${governmentDatasets.updateFrequency})`,
        license: sql`COALESCE(VALUES(${governmentDatasets.license}), ${governmentDatasets.license})`,
        relatedUrl: sql`COALESCE(VALUES(${governmentDatasets.relatedUrl}), ${governmentDatasets.relatedUrl})`,
        cost: sql`COALESCE(VALUES(${governmentDatasets.cost}), ${governmentDatasets.cost})`,
        issuedAt: sql`COALESCE(VALUES(${governmentDatasets.issuedAt}), ${governmentDatasets.issuedAt})`,
        modifiedAt: sql`COALESCE(VALUES(${governmentDatasets.modifiedAt}), ${governmentDatasets.modifiedAt})`,
        notes: sql`COALESCE(VALUES(${governmentDatasets.notes}), ${governmentDatasets.notes})`,
        recordCountText: sql`COALESCE(VALUES(${governmentDatasets.recordCountText}), ${governmentDatasets.recordCountText})`,
        status: sql`VALUES(${governmentDatasets.status})`,
        rawHash: sql`VALUES(${governmentDatasets.rawHash})`,
        lastSeenAt: sql`VALUES(${governmentDatasets.lastSeenAt})`,
        updatedAt: sql`VALUES(${governmentDatasets.updatedAt})`,
      },
    });
  return changed;
}

async function startSync(mode: "full" | "delta", reportDate?: string) {
  const db = await requireDb();
  const [created] = await db
    .insert(governmentCatalogSyncs)
    .values({
      mode,
      status: "running",
      reportDate: reportDate ?? null,
      startedAt: Date.now(),
    })
    .$returningId();
  return created.id;
}

async function finishSync(
  id: number,
  values: Partial<typeof governmentCatalogSyncs.$inferInsert>
) {
  const db = await requireDb();
  await db
    .update(governmentCatalogSyncs)
    .set({ ...values, finishedAt: Date.now() })
    .where(eq(governmentCatalogSyncs.id, id));
}

export function resolveFullSyncProvenance(
  sourceFileSha256: string,
  release?: { snapshotDate: string; sha256: string }
) {
  return {
    reportDate: release?.snapshotDate ?? null,
    snapshotSha256: release?.sha256 ?? sourceFileSha256,
    sourceFileSha256,
  };
}

export async function syncGovernmentCatalogFile(
  path: string,
  release?: { snapshotDate: string; sha256: string }
) {
  const syncStartedAt = Date.now();
  const syncId = await startSync("full", release?.snapshotDate);
  const hasher = createHash("sha256");
  let seen = 0;
  let changed = 0;
  let batch: NormalizedDataset[] = [];

  try {
    const hashStream = createReadStream(path);
    for await (const chunk of hashStream) hasher.update(chunk as Buffer);

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
      const row = normalizeGovernmentRow(raw as GovernmentRow, syncStartedAt);
      if (!row) continue;
      batch.push(row);
      seen += 1;
      if (batch.length >= BATCH_SIZE) {
        changed += await upsertBatch(batch);
        batch = [];
      }
      if (seen % 5000 === 0)
        console.log(`[GovernmentCatalog] imported ${seen} datasets`);
    }
    changed += await upsertBatch(batch);
    const db = await requireDb();
    await db
      .update(governmentDatasets)
      .set({ status: "withdrawn", updatedAt: Date.now() })
      .where(
        and(
          lt(governmentDatasets.lastSeenAt, syncStartedAt),
          eq(governmentDatasets.status, "active")
        )
      );
    const provenance = resolveFullSyncProvenance(hasher.digest("hex"), release);
    const { snapshotSha256, sourceFileSha256 } = provenance;
    await finishSync(syncId, {
      status: "succeeded",
      recordsSeen: seen,
      recordsChanged: changed,
      snapshotSha256,
      message: `Full catalog synchronized: ${seen} datasets.`,
    });
    return {
      ok: true,
      mode: "full" as const,
      reportDate: provenance.reportDate,
      recordsSeen: seen,
      recordsChanged: changed,
      snapshotSha256,
      sourceFileSha256,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await finishSync(syncId, {
      status: "failed",
      recordsSeen: seen,
      recordsChanged: changed,
      message,
    });
    throw error;
  }
}

export async function syncGovernmentCatalogDelta(reportDate: string) {
  const syncId = await startSync("delta", reportDate);
  const observedAt = Date.now();
  let seen = 0;
  let changed = 0;
  try {
    const url = `${NATIONAL_DELTA_URL}?format=json&report_date=${encodeURIComponent(reportDate)}`;
    const response = await fetch(url, {
      headers: { "User-Agent": "PiSuAI-OpenData-Indexer/1.0" },
      signal: AbortSignal.timeout(90_000),
    });
    if (!response.ok)
      throw new Error(`data.gov.tw delta returned HTTP ${response.status}`);
    const body = await response.text();
    const rows = JSON.parse(body) as GovernmentRow[];
    let batch: NormalizedDataset[] = [];
    for (const raw of rows) {
      const changeStatus = text(raw["資料集變動狀態"]);
      if (
        !changeStatus ||
        !["資料集上架", "資料集修改", "資料集下架"].includes(changeStatus)
      )
        continue;
      const row = normalizeGovernmentRow(raw, observedAt);
      if (!row) continue;
      batch.push(row);
      seen += 1;
      if (batch.length >= BATCH_SIZE) {
        changed += await upsertBatch(batch);
        batch = [];
      }
    }
    changed += await upsertBatch(batch);
    const snapshotSha256 = createHash("sha256").update(body).digest("hex");
    await finishSync(syncId, {
      status: "succeeded",
      recordsSeen: seen,
      recordsChanged: changed,
      snapshotSha256,
      message: `Delta ${reportDate}: ${seen} datasets.`,
    });
    return {
      ok: true,
      mode: "delta" as const,
      reportDate,
      recordsSeen: seen,
      recordsChanged: changed,
      snapshotSha256,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await finishSync(syncId, {
      status: "failed",
      recordsSeen: seen,
      recordsChanged: changed,
      message,
    });
    throw error;
  }
}

export function previousTaipeiDate(reference = new Date()) {
  const taipei = new Date(reference.getTime() + 8 * 60 * 60 * 1000);
  taipei.setUTCDate(taipei.getUTCDate() - 1);
  return taipei.toISOString().slice(0, 10);
}
