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

const table = `automation_configs_migration_test_${process.pid}`;
const quotedTable = `\`${table}\``;
const migrationPath = new URL("../drizzle/0004_rename_report_automation_key.sql", import.meta.url);
const migration = await readFile(migrationPath, "utf8");
const upMigration = migration.split("-- Down migration")[0];
const statements = upMigration
  .replaceAll("`automation_configs`", quotedTable)
  .replace(/^--> statement-breakpoint$/gm, "")
  .split(";")
  .map(statement => statement.trim())
  .filter(Boolean);

const connection = await createConnection(process.env.DATABASE_URL);

try {
  await connection.query(`CREATE TEMPORARY TABLE ${quotedTable} LIKE \`automation_configs\``);
  await connection.execute(
    `INSERT INTO ${quotedTable} (\`key\`, \`enabled\`, \`cronExpression\`, \`scheduleCronTaskUid\`, \`model\`, \`promptVersion\`, \`updatedAt\`)
     VALUES (?, true, ?, ?, ?, ?, ?)`,
    [
      LEGACY_REPORT_AUTOMATION_KEY,
      "0 0 1 */2 * *",
      "migration-test-task-uid",
      "gpt-5-mini",
      "evidence-report-v1.0",
      Date.now(),
    ],
  );

  for (let pass = 0; pass < 2; pass += 1) {
    for (const statement of statements) await connection.query(statement);
  }

  const findByKey = async (key: string) => {
    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT * FROM ${quotedTable} WHERE \`key\` = ? LIMIT 1`,
      [key],
    );
    return (rows[0] as any) ?? null;
  };

  const config = await resolveReportAutomationConfig(findByKey);
  if (!config || config.key !== REPORT_AUTOMATION_KEY) {
    throw new Error("The migrated report automation config was not readable through the new key");
  }

  const [taskRows] = await connection.execute<RowDataPacket[]>(
    `SELECT * FROM ${quotedTable} WHERE \`scheduleCronTaskUid\` = ? LIMIT 1`,
    ["migration-test-task-uid"],
  );
  const taskConfig = taskRows[0] as { key?: string } | undefined;
  if (!taskConfig?.key || !isReportAutomationConfigKey(taskConfig.key)) {
    throw new Error("The migrated task UID did not resolve to an allowed report automation key");
  }

  const [legacyRows] = await connection.execute<RowDataPacket[]>(
    `SELECT \`id\` FROM ${quotedTable} WHERE \`key\` = ?`,
    [LEGACY_REPORT_AUTOMATION_KEY],
  );
  if (legacyRows.length !== 0) throw new Error("Legacy automation key remained after migration");

  await connection.query(`TRUNCATE TABLE ${quotedTable}`);
  await connection.execute(
    `INSERT INTO ${quotedTable} (\`key\`, \`enabled\`, \`cronExpression\`, \`scheduleCronTaskUid\`, \`model\`, \`promptVersion\`, \`updatedAt\`)
     VALUES (?, false, ?, NULL, ?, ?, ?), (?, true, ?, ?, ?, ?, ?)`,
    [
      REPORT_AUTOMATION_KEY,
      "0 0 1 */2 * *",
      "gpt-5-mini",
      "evidence-report-v1.0",
      Date.now(),
      LEGACY_REPORT_AUTOMATION_KEY,
      "0 0 1 */2 * *",
      "duplicate-test-task-uid",
      "gpt-5-mini",
      "evidence-report-v1.0",
      Date.now(),
    ],
  );

  for (const statement of statements) await connection.query(statement);
  const [dedupedRows] = await connection.execute<RowDataPacket[]>(
    `SELECT \`key\`, \`enabled\`, \`scheduleCronTaskUid\` FROM ${quotedTable}`,
  );
  if (
    dedupedRows.length !== 1 ||
    dedupedRows[0]?.key !== REPORT_AUTOMATION_KEY ||
    !dedupedRows[0]?.enabled ||
    dedupedRows[0]?.scheduleCronTaskUid !== "duplicate-test-task-uid"
  ) {
    throw new Error("Concurrent legacy/current rows were not merged safely");
  }

  console.log(
    JSON.stringify({
      migration: "0004_rename_report_automation_key.sql",
      passes: 2,
      migratedKey: config.key,
      taskUidVerified: true,
      legacyRows: 0,
      duplicateRowsMerged: true,
    }),
  );
} finally {
  await connection.query(`DROP TEMPORARY TABLE IF EXISTS ${quotedTable}`);
  await connection.end();
}
