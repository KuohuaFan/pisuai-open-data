import {
  bigint,
  boolean,
  index,
  int,
  mediumtext,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const sources = mysqlTable(
  "sources",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 160 }).notNull(),
    name: varchar("name", { length: 240 }).notNull(),
    provider: varchar("provider", { length: 200 }).notNull(),
    category: varchar("category", { length: 80 }).notNull(),
    description: text("description").notNull(),
    sourceUrl: text("sourceUrl").notNull(),
    repoUrl: text("repoUrl"),
    accessType: varchar("accessType", { length: 60 }).notNull(),
    codeLicense: varchar("codeLicense", { length: 120 }),
    dataLicense: varchar("dataLicense", { length: 180 }),
    rightsClass: mysqlEnum("rightsClass", ["A", "B", "C", "D", "MIXED"])
      .default("C")
      .notNull(),
    status: mysqlEnum("status", ["active", "review", "paused", "withdrawn"])
      .default("review")
      .notNull(),
    isPublic: boolean("isPublic").default(false).notNull(),
    featured: boolean("featured").default(false).notNull(),
    updateCadence: varchar("updateCadence", { length: 120 }),
    commitSha: varchar("commitSha", { length: 64 }),
    recordCount: int("recordCount").default(0).notNull(),
    riskNote: text("riskNote"),
    attribution: text("attribution"),
    lastVerifiedAt: bigint("lastVerifiedAt", { mode: "number" }),
    lastDataAt: bigint("lastDataAt", { mode: "number" }),
    createdAt: bigint("createdAt", { mode: "number" }).notNull(),
    updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
  },
  table => [
    uniqueIndex("sources_slug_uq").on(table.slug),
    index("sources_public_status_idx").on(table.isPublic, table.status),
    index("sources_category_idx").on(table.category),
    index("sources_rights_idx").on(table.rightsClass),
  ],
);

export const governmentDatasets = mysqlTable(
  "government_datasets",
  {
    id: int("id").autoincrement().primaryKey(),
    datasetId: varchar("datasetId", { length: 40 }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    dataProperty: varchar("dataProperty", { length: 80 }),
    serviceCategory: varchar("serviceCategory", { length: 100 }).notNull(),
    quality: varchar("quality", { length: 40 }),
    formats: mediumtext("formats"),
    downloadUrls: mediumtext("downloadUrls"),
    encodings: varchar("encodings", { length: 240 }),
    publicationMethod: varchar("publicationMethod", { length: 120 }),
    description: mediumtext("description"),
    fieldDescription: mediumtext("fieldDescription"),
    publisher: varchar("publisher", { length: 240 }).notNull(),
    updateFrequency: varchar("updateFrequency", { length: 120 }),
    license: varchar("license", { length: 200 }),
    relatedUrl: mediumtext("relatedUrl"),
    cost: varchar("cost", { length: 80 }),
    issuedAt: bigint("issuedAt", { mode: "number" }),
    modifiedAt: bigint("modifiedAt", { mode: "number" }),
    notes: mediumtext("notes"),
    recordCountText: varchar("recordCountText", { length: 120 }),
    status: mysqlEnum("status", ["active", "withdrawn"]).default("active").notNull(),
    rawHash: varchar("rawHash", { length: 64 }).notNull(),
    firstSeenAt: bigint("firstSeenAt", { mode: "number" }).notNull(),
    lastSeenAt: bigint("lastSeenAt", { mode: "number" }).notNull(),
    updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
  },
  table => [
    uniqueIndex("government_datasets_dataset_id_uq").on(table.datasetId),
    index("government_datasets_category_idx").on(table.serviceCategory),
    index("government_datasets_publisher_idx").on(table.publisher),
    index("government_datasets_modified_idx").on(table.modifiedAt),
    index("government_datasets_status_idx").on(table.status),
  ],
);

export const governmentCatalogSyncs = mysqlTable(
  "government_catalog_syncs",
  {
    id: int("id").autoincrement().primaryKey(),
    mode: mysqlEnum("mode", ["full", "delta"]).notNull(),
    status: mysqlEnum("status", ["running", "succeeded", "failed", "skipped"]).notNull(),
    reportDate: varchar("reportDate", { length: 10 }),
    recordsSeen: int("recordsSeen").default(0).notNull(),
    recordsChanged: int("recordsChanged").default(0).notNull(),
    snapshotSha256: varchar("snapshotSha256", { length: 64 }),
    message: text("message"),
    startedAt: bigint("startedAt", { mode: "number" }).notNull(),
    finishedAt: bigint("finishedAt", { mode: "number" }),
  },
  table => [index("government_catalog_syncs_started_idx").on(table.startedAt)],
);

export const reports = mysqlTable(
  "reports",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 180 }).notNull(),
    title: varchar("title", { length: 300 }).notNull(),
    dek: text("dek").notNull(),
    summary: text("summary").notNull(),
    body: text("body").notNull(),
    topic: varchar("topic", { length: 100 }).notNull(),
    status: mysqlEnum("status", ["draft", "review", "published", "withdrawn"])
      .default("draft")
      .notNull(),
    sourceCount: int("sourceCount").default(0).notNull(),
    readingMinutes: int("readingMinutes").default(5).notNull(),
    generatedBy: varchar("generatedBy", { length: 80 }).default("editorial").notNull(),
    model: varchar("model", { length: 100 }),
    promptVersion: varchar("promptVersion", { length: 40 }),
    reviewNote: text("reviewNote"),
    createdBy: int("createdBy"),
    publishedAt: bigint("publishedAt", { mode: "number" }),
    createdAt: bigint("createdAt", { mode: "number" }).notNull(),
    updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
  },
  table => [
    uniqueIndex("reports_slug_uq").on(table.slug),
    index("reports_status_published_idx").on(table.status, table.publishedAt),
  ],
);

export const reportSources = mysqlTable(
  "report_sources",
  {
    id: int("id").autoincrement().primaryKey(),
    reportId: int("reportId").notNull(),
    sourceId: int("sourceId").notNull(),
    evidenceUrl: text("evidenceUrl"),
    note: text("note"),
    createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  },
  table => [
    uniqueIndex("report_source_uq").on(table.reportId, table.sourceId),
    index("report_source_report_idx").on(table.reportId),
  ],
);

export const sourceBookmarks = mysqlTable(
  "source_bookmarks",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    sourceId: int("sourceId").notNull(),
    createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  },
  table => [uniqueIndex("source_bookmark_uq").on(table.userId, table.sourceId)],
);

export const reportBookmarks = mysqlTable(
  "report_bookmarks",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    reportId: int("reportId").notNull(),
    createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  },
  table => [uniqueIndex("report_bookmark_uq").on(table.userId, table.reportId)],
);

export const ingestionRuns = mysqlTable(
  "ingestion_runs",
  {
    id: int("id").autoincrement().primaryKey(),
    sourceId: int("sourceId"),
    trigger: mysqlEnum("trigger", ["manual", "scheduled", "webhook"]).notNull(),
    status: mysqlEnum("status", ["queued", "running", "succeeded", "failed", "skipped"]).notNull(),
    recordsSeen: int("recordsSeen").default(0).notNull(),
    recordsChanged: int("recordsChanged").default(0).notNull(),
    rawSha256: varchar("rawSha256", { length: 64 }),
    message: text("message"),
    startedAt: bigint("startedAt", { mode: "number" }).notNull(),
    finishedAt: bigint("finishedAt", { mode: "number" }),
  },
  table => [index("ingestion_runs_started_idx").on(table.startedAt)],
);

export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    actorUserId: int("actorUserId"),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entityType", { length: 80 }).notNull(),
    entityId: int("entityId"),
    details: text("details"),
    createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  },
  table => [index("audit_created_idx").on(table.createdAt)],
);

export const automationConfigs = mysqlTable(
  "automation_configs",
  {
    id: int("id").autoincrement().primaryKey(),
    key: varchar("key", { length: 80 }).notNull(),
    enabled: boolean("enabled").default(false).notNull(),
    cronExpression: varchar("cronExpression", { length: 80 }).notNull(),
    scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
    model: varchar("model", { length: 100 }).default("gpt-5-mini").notNull(),
    promptVersion: varchar("promptVersion", { length: 40 }).default("v1.0").notNull(),
    lastRunAt: bigint("lastRunAt", { mode: "number" }),
    lastResult: text("lastResult"),
    updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
  },
  table => [
    uniqueIndex("automation_key_uq").on(table.key),
    index("automation_task_uid_idx").on(table.scheduleCronTaskUid),
  ],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Source = typeof sources.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type GovernmentDataset = typeof governmentDatasets.$inferSelect;
