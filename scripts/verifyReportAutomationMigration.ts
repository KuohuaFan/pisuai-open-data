import "dotenv/config";
import { readFile } from "node:fs/promises";
import { createConnection, type RowDataPacket } from "mysql2/promise";
import {
  isReportAutomationConfigKey,
  resolveReportAutomationConfig,
} from "../server/db";
import {
  LEGACY_REPORT_AUTOMATION_KEY,
  REPORT_AUTOMATION_KEY,
} from "../shared/const";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const PRE_MERGE_SEED = {
  key: "biennial-report",
  enabled: false,
  cronExpression: "0 0 1 */2 * *",
} as const;

if (LEGACY_REPORT_AUTOMATION_KEY !== PRE_MERGE_SEED.key) {
  throw new Error(
    "The legacy constant no longer matches the pre-merge main seed key"
  );
}

const table = `automation_configs_migration_test_${process.pid}`;
const quotedTable = `\`${table}\``;

async function readUpStatements(filename: string) {
  const migration = await readFile(
    new URL(`../drizzle/${filename}`, import.meta.url),
    "utf8"
  );
  return migration
    .split("-- Down migration")[0]
    .replaceAll("`automation_configs`", quotedTable)
    .replace(/^--> statement-breakpoint$/gm, "")
    .split(";")
    .map(statement => statement.trim())
    .filter(Boolean);
}

const migrations = [
  {
    filename: "0004_rename_report_automation_key.sql",
    statements: await readUpStatements("0004_rename_report_automation_key.sql"),
  },
  {
    filename: "0005_rename_biennial_report_key.sql",
    statements: await readUpStatements("0005_rename_biennial_report_key.sql"),
  },
];

const connection = await createConnection(process.env.DATABASE_URL);

async function applyMigrations(passes = 1) {
  for (let pass = 0; pass < passes; pass += 1) {
    for (const migration of migrations) {
      for (const statement of migration.statements)
        await connection.query(statement);
    }
  }
}

async function listRows() {
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT \`key\`, \`enabled\`, \`cronExpression\`, \`scheduleCronTaskUid\` FROM ${quotedTable} ORDER BY \`key\``
  );
  return rows as Array<{
    key: string;
    enabled: number | boolean;
    cronExpression: string;
    scheduleCronTaskUid: string | null;
  }>;
}

try {
  await connection.query(
    `CREATE TEMPORARY TABLE ${quotedTable} LIKE \`automation_configs\``
  );

  // Exact regression fixture from main before PR #6.
  await connection.execute(
    `INSERT INTO ${quotedTable} (\`key\`, \`enabled\`, \`cronExpression\`, \`scheduleCronTaskUid\`, \`model\`, \`promptVersion\`, \`updatedAt\`)
     VALUES (?, ?, ?, NULL, ?, ?, ?)`,
    [
      PRE_MERGE_SEED.key,
      PRE_MERGE_SEED.enabled,
      PRE_MERGE_SEED.cronExpression,
      "gpt-5-mini",
      "evidence-report-v1.0",
      Date.now(),
    ]
  );

  await applyMigrations(2);
  const migratedRows = await listRows();
  const migrated = migratedRows[0];
  if (
    migratedRows.length !== 1 ||
    migrated?.key !== REPORT_AUTOMATION_KEY ||
    Boolean(migrated?.enabled) !== PRE_MERGE_SEED.enabled ||
    migrated?.cronExpression !== PRE_MERGE_SEED.cronExpression ||
    migrated?.scheduleCronTaskUid !== null
  ) {
    throw new Error(
      `Pre-merge seed regression failed: ${JSON.stringify(migratedRows)}`
    );
  }

  const findByKey = async (key: string) => {
    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT * FROM ${quotedTable} WHERE \`key\` = ? LIMIT 1`,
      [key]
    );
    return (rows[0] as any) ?? null;
  };
  const config = await resolveReportAutomationConfig(findByKey);
  if (!config || config.key !== REPORT_AUTOMATION_KEY) {
    throw new Error(
      "The migrated pre-merge config was not readable through the current key"
    );
  }

  // When both rows exist, preserve the active state and legacy task binding.
  await connection.query(`TRUNCATE TABLE ${quotedTable}`);
  await connection.execute(
    `INSERT INTO ${quotedTable} (\`key\`, \`enabled\`, \`cronExpression\`, \`scheduleCronTaskUid\`, \`model\`, \`promptVersion\`, \`updatedAt\`)
     VALUES (?, false, ?, NULL, ?, ?, ?), (?, true, ?, ?, ?, ?, ?)`,
    [
      REPORT_AUTOMATION_KEY,
      "0 0 3 * * *",
      "gpt-5-mini",
      "evidence-report-v1.0",
      Date.now(),
      LEGACY_REPORT_AUTOMATION_KEY,
      PRE_MERGE_SEED.cronExpression,
      "legacy-task-uid",
      "gpt-5-mini",
      "evidence-report-v1.0",
      Date.now(),
    ]
  );

  await applyMigrations(2);
  const mergedRows = await listRows();
  if (
    mergedRows.length !== 1 ||
    mergedRows[0]?.key !== REPORT_AUTOMATION_KEY ||
    !Boolean(mergedRows[0]?.enabled) ||
    mergedRows[0]?.scheduleCronTaskUid !== "legacy-task-uid"
  ) {
    throw new Error(
      `Concurrent legacy/current rows were not merged safely: ${JSON.stringify(mergedRows)}`
    );
  }
  if (!isReportAutomationConfigKey(mergedRows[0].key)) {
    throw new Error(
      "The merged row no longer resolves to an allowed report automation key"
    );
  }

  console.log(
    JSON.stringify({
      migrations: migrations.map(item => item.filename),
      passes: 2,
      preMergeSeed: PRE_MERGE_SEED,
      result: migrated,
      duplicateRowsMerged: true,
      preservedTaskUid: "legacy-task-uid",
    })
  );
} finally {
  await connection.query(`DROP TEMPORARY TABLE IF EXISTS ${quotedTable}`);
  await connection.end();
}
