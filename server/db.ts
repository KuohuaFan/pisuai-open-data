import { and, count, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  auditLogs,
  automationConfigs,
  ingestionRuns,
  InsertUser,
  reportBookmarks,
  reports,
  reportSources,
  sourceBookmarks,
  sources,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

function requireDb(db: Awaited<ReturnType<typeof getDb>>) {
  if (!db) throw new Error("Database is not available");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = requireDb(await getDb());
  const now = new Date();
  const role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");

  await db
    .insert(users)
    .values({
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      loginMethod: user.loginMethod ?? null,
      role,
      createdAt: user.createdAt ?? now,
      updatedAt: now,
      lastSignedIn: user.lastSignedIn ?? now,
    })
    .onDuplicateKeyUpdate({
      set: {
        name: user.name ?? null,
        email: user.email ?? null,
        loginMethod: user.loginMethod ?? null,
        role,
        updatedAt: now,
        lastSignedIn: user.lastSignedIn ?? now,
      },
    });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listPublicSources(input: {
  q?: string;
  category?: string;
  rightsClass?: "A" | "B" | "C" | "D" | "MIXED";
  limit?: number;
}) {
  const db = requireDb(await getDb());
  const conditions = [eq(sources.isPublic, true), eq(sources.status, "active")];
  if (input.category) conditions.push(eq(sources.category, input.category));
  if (input.rightsClass) conditions.push(eq(sources.rightsClass, input.rightsClass));
  if (input.q) {
    const term = `%${input.q}%`;
    conditions.push(
      or(like(sources.name, term), like(sources.provider, term), like(sources.description, term))!,
    );
  }

  return db
    .select()
    .from(sources)
    .where(and(...conditions))
    .orderBy(desc(sources.featured), desc(sources.lastVerifiedAt), sources.name)
    .limit(Math.min(input.limit ?? 60, 100));
}

export async function listSourceFacets() {
  const db = requireDb(await getDb());
  const categories = await db
    .select({ category: sources.category, total: count() })
    .from(sources)
    .where(and(eq(sources.isPublic, true), eq(sources.status, "active")))
    .groupBy(sources.category)
    .orderBy(desc(count()));
  const rights = await db
    .select({ rightsClass: sources.rightsClass, total: count() })
    .from(sources)
    .where(and(eq(sources.isPublic, true), eq(sources.status, "active")))
    .groupBy(sources.rightsClass);
  return { categories, rights };
}

export async function getPublicSourceBySlug(slug: string) {
  const db = requireDb(await getDb());
  const [source] = await db
    .select()
    .from(sources)
    .where(and(eq(sources.slug, slug), eq(sources.isPublic, true), eq(sources.status, "active")))
    .limit(1);
  return source ?? null;
}

export async function listPublishedReports(limit = 24) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(reports)
    .where(eq(reports.status, "published"))
    .orderBy(desc(reports.publishedAt))
    .limit(Math.min(limit, 60));
}

export async function getPublishedReportBySlug(slug: string) {
  const db = requireDb(await getDb());
  const [report] = await db
    .select()
    .from(reports)
    .where(and(eq(reports.slug, slug), eq(reports.status, "published")))
    .limit(1);
  if (!report) return null;

  const citations = await db
    .select({
      id: sources.id,
      slug: sources.slug,
      name: sources.name,
      provider: sources.provider,
      sourceUrl: sources.sourceUrl,
      rightsClass: sources.rightsClass,
      evidenceUrl: reportSources.evidenceUrl,
      note: reportSources.note,
    })
    .from(reportSources)
    .innerJoin(sources, eq(reportSources.sourceId, sources.id))
    .where(eq(reportSources.reportId, report.id));
  return { ...report, citations };
}

export async function toggleSourceBookmark(userId: number, sourceId: number) {
  const db = requireDb(await getDb());
  const [existing] = await db
    .select({ id: sourceBookmarks.id })
    .from(sourceBookmarks)
    .where(and(eq(sourceBookmarks.userId, userId), eq(sourceBookmarks.sourceId, sourceId)))
    .limit(1);
  if (existing) {
    await db.delete(sourceBookmarks).where(eq(sourceBookmarks.id, existing.id));
    return { bookmarked: false };
  }
  await db.insert(sourceBookmarks).values({ userId, sourceId, createdAt: Date.now() });
  return { bookmarked: true };
}

export async function toggleReportBookmark(userId: number, reportId: number) {
  const db = requireDb(await getDb());
  const [existing] = await db
    .select({ id: reportBookmarks.id })
    .from(reportBookmarks)
    .where(and(eq(reportBookmarks.userId, userId), eq(reportBookmarks.reportId, reportId)))
    .limit(1);
  if (existing) {
    await db.delete(reportBookmarks).where(eq(reportBookmarks.id, existing.id));
    return { bookmarked: false };
  }
  await db.insert(reportBookmarks).values({ userId, reportId, createdAt: Date.now() });
  return { bookmarked: true };
}

export async function getMemberLibrary(userId: number) {
  const db = requireDb(await getDb());
  const savedSources = await db
    .select({ source: sources, savedAt: sourceBookmarks.createdAt })
    .from(sourceBookmarks)
    .innerJoin(sources, eq(sourceBookmarks.sourceId, sources.id))
    .where(eq(sourceBookmarks.userId, userId))
    .orderBy(desc(sourceBookmarks.createdAt));
  const savedReports = await db
    .select({ report: reports, savedAt: reportBookmarks.createdAt })
    .from(reportBookmarks)
    .innerJoin(reports, eq(reportBookmarks.reportId, reports.id))
    .where(eq(reportBookmarks.userId, userId))
    .orderBy(desc(reportBookmarks.createdAt));
  return { savedSources, savedReports };
}

export async function getAdminOverview() {
  const db = requireDb(await getDb());
  const [[sourceStats], [reportStats], [runStats]] = await Promise.all([
    db
      .select({ total: count(), publicCount: sql<number>`sum(${sources.isPublic} = true)` })
      .from(sources),
    db
      .select({ total: count(), reviewCount: sql<number>`sum(${reports.status} = 'review')` })
      .from(reports),
    db
      .select({ total: count(), failedCount: sql<number>`sum(${ingestionRuns.status} = 'failed')` })
      .from(ingestionRuns),
  ]);
  return { sourceStats, reportStats, runStats };
}

export async function listAdminSources() {
  const db = requireDb(await getDb());
  return db.select().from(sources).orderBy(desc(sources.updatedAt));
}

export async function listAdminReports() {
  const db = requireDb(await getDb());
  return db.select().from(reports).orderBy(desc(reports.updatedAt));
}

export async function listIngestionRuns() {
  const db = requireDb(await getDb());
  return db
    .select({ run: ingestionRuns, sourceName: sources.name })
    .from(ingestionRuns)
    .leftJoin(sources, eq(ingestionRuns.sourceId, sources.id))
    .orderBy(desc(ingestionRuns.startedAt))
    .limit(80);
}

export async function updateSourceGovernance(
  id: number,
  patch: Partial<{
    rightsClass: "A" | "B" | "C" | "D" | "MIXED";
    status: "active" | "review" | "paused" | "withdrawn";
    isPublic: boolean;
    featured: boolean;
    riskNote: string | null;
    attribution: string | null;
  }>,
  actorUserId: number,
) {
  const db = requireDb(await getDb());
  await db.update(sources).set({ ...patch, updatedAt: Date.now() }).where(eq(sources.id, id));
  await writeAudit(actorUserId, "source.governance.update", "source", id, patch);
  return { ok: true };
}

export async function createReport(input: {
  title: string;
  dek: string;
  summary: string;
  body: string;
  topic: string;
  sourceIds: number[];
  model?: string;
  promptVersion?: string;
  createdBy?: number;
}) {
  const db = requireDb(await getDb());
  const now = Date.now();
  const slugBase = input.title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 130);
  const slug = `${slugBase || "report"}-${now.toString(36)}`;
  const readingMinutes = Math.max(4, Math.ceil(input.body.length / 650));
  const [created] = await db
    .insert(reports)
    .values({
      slug,
      title: input.title,
      dek: input.dek,
      summary: input.summary,
      body: input.body,
      topic: input.topic,
      status: "review",
      sourceCount: input.sourceIds.length,
      readingMinutes,
      generatedBy: input.model ? "ai-assisted" : "editorial",
      model: input.model ?? null,
      promptVersion: input.promptVersion ?? null,
      createdBy: input.createdBy ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .$returningId();
  if (input.sourceIds.length) {
    await db.insert(reportSources).values(
      input.sourceIds.map(sourceId => ({
        reportId: created.id,
        sourceId,
        createdAt: now,
      })),
    );
  }
  await writeAudit(input.createdBy ?? null, "report.draft.create", "report", created.id, {
    sourceIds: input.sourceIds,
    model: input.model,
  });
  return { id: created.id, slug };
}

export async function updateReportStatus(
  id: number,
  status: "draft" | "review" | "published" | "withdrawn",
  actorUserId: number,
  reviewNote?: string,
) {
  const db = requireDb(await getDb());
  const now = Date.now();
  await db
    .update(reports)
    .set({
      status,
      reviewNote: reviewNote ?? null,
      publishedAt: status === "published" ? now : undefined,
      updatedAt: now,
    })
    .where(eq(reports.id, id));
  await writeAudit(actorUserId, `report.${status}`, "report", id, { reviewNote });
  return { ok: true };
}

export async function getReportCandidateSources(limit = 8) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(sources)
    .where(and(eq(sources.status, "active"), eq(sources.isPublic, true), inArray(sources.rightsClass, ["A", "B", "MIXED"])))
    .orderBy(desc(sources.lastVerifiedAt), desc(sources.featured))
    .limit(limit);
}

export async function createIngestionRun(trigger: "manual" | "scheduled" | "webhook") {
  const db = requireDb(await getDb());
  const [created] = await db
    .insert(ingestionRuns)
    .values({ trigger, status: "running", startedAt: Date.now() })
    .$returningId();
  return created.id;
}

export async function finishIngestionRun(
  id: number,
  status: "succeeded" | "failed" | "skipped",
  message: string,
  recordsSeen = 0,
  recordsChanged = 0,
) {
  const db = requireDb(await getDb());
  await db
    .update(ingestionRuns)
    .set({ status, message, recordsSeen, recordsChanged, finishedAt: Date.now() })
    .where(eq(ingestionRuns.id, id));
}

export async function getAutomationByTaskUid(taskUid: string) {
  const db = requireDb(await getDb());
  const [config] = await db
    .select()
    .from(automationConfigs)
    .where(eq(automationConfigs.scheduleCronTaskUid, taskUid))
    .limit(1);
  return config ?? null;
}

export async function getAutomationConfig(key = "biennial-report") {
  const db = requireDb(await getDb());
  const [config] = await db
    .select()
    .from(automationConfigs)
    .where(eq(automationConfigs.key, key))
    .limit(1);
  return config ?? null;
}

export async function updateAutomationResult(id: number, result: string) {
  const db = requireDb(await getDb());
  await db
    .update(automationConfigs)
    .set({ lastRunAt: Date.now(), lastResult: result, updatedAt: Date.now() })
    .where(eq(automationConfigs.id, id));
}

export async function writeAudit(
  actorUserId: number | null,
  action: string,
  entityType: string,
  entityId: number | null,
  details: unknown,
) {
  const db = requireDb(await getDb());
  await db.insert(auditLogs).values({
    actorUserId,
    action,
    entityType,
    entityId,
    details: JSON.stringify(details ?? {}),
    createdAt: Date.now(),
  });
}
