import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
  isReportAutomationConfigKey,
  resolveReportAutomationConfig,
} from "./db";
import {
  LEGACY_REPORT_AUTOMATION_KEY,
  REPORT_AUTOMATION_KEY,
} from "../shared/const";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

function readProjectFile(relativePath: string) {
  return readFileSync(`${projectRoot}/${relativePath}`, "utf8");
}

function automationConfig(key: string) {
  return {
    id: 1,
    key,
    enabled: true,
    cronExpression: "0 0 1 */2 * *",
    scheduleCronTaskUid: "test-task-uid",
    model: "gpt-5-mini",
    promptVersion: "evidence-report-v1.0",
    lastRunAt: null,
    lastResult: null,
    updatedAt: Date.now(),
  };
}

describe("scheduled report route naming", () => {
  it("registers the report draft route and handler", () => {
    const index = readProjectFile("server/_core/index.ts");
    const scheduled = readProjectFile("server/scheduled.ts");

    expect(index).toContain('app.post("/api/scheduled/generate-report-draft", generateReportDraftHandler)');
    expect(scheduled).toContain("export async function generateReportDraftHandler");
  });

  it("prefers the new automation key without querying the legacy key", async () => {
    const calls: string[] = [];
    const current = automationConfig(REPORT_AUTOMATION_KEY);
    const result = await resolveReportAutomationConfig(async key => {
      calls.push(key);
      return key === REPORT_AUTOMATION_KEY ? current : null;
    });

    expect(result).toEqual(current);
    expect(calls).toEqual([REPORT_AUTOMATION_KEY]);
  });

  it("falls back to the legacy key and logs one deprecation warning", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const calls: string[] = [];
    const legacy = automationConfig(LEGACY_REPORT_AUTOMATION_KEY);
    const findByKey = async (key: string) => {
      calls.push(key);
      return key === LEGACY_REPORT_AUTOMATION_KEY ? legacy : null;
    };

    expect(await resolveReportAutomationConfig(findByKey)).toEqual(legacy);
    expect(await resolveReportAutomationConfig(findByKey)).toEqual(legacy);
    expect(calls).toEqual([
      REPORT_AUTOMATION_KEY,
      LEGACY_REPORT_AUTOMATION_KEY,
      REPORT_AUTOMATION_KEY,
      LEGACY_REPORT_AUTOMATION_KEY,
    ]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain("Deprecated key");
    warn.mockRestore();
  });

  it("accepts only the current or legacy report automation key for task UID execution", () => {
    expect(LEGACY_REPORT_AUTOMATION_KEY).toBe("biennial-report");
    expect(isReportAutomationConfigKey(REPORT_AUTOMATION_KEY)).toBe(true);
    expect(isReportAutomationConfigKey(LEGACY_REPORT_AUTOMATION_KEY)).toBe(true);
    expect(isReportAutomationConfigKey("government-catalog-sync")).toBe(false);

    const migration = readProjectFile("drizzle/0005_rename_biennial_report_key.sql");
    expect(migration).toContain("`legacy`.`key` = 'biennial-report'");
    expect(migration).toContain("WHERE `key` = 'biennial-report'");
    expect(migration).toContain("-- Down migration (manual and idempotent):");
  });
});
