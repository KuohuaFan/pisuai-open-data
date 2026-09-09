import type { Request, Response } from "express";
import { getAutomationByTaskUid, updateAutomationResult } from "./db";
import { generateEvidenceBoundDraft } from "./reportGenerator";
import { sdk } from "./_core/sdk";

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export async function generateBiennialReportHandler(req: Request, res: Response) {
  let taskUid: string | undefined;
  try {
    const user = await sdk.authenticateRequest(req);
    taskUid = user.taskUid;
    if (!user.isCron || !taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const config = await getAutomationByTaskUid(taskUid);
    if (!config) return res.json({ ok: true, skipped: "orphan" });
    if (!config.enabled) return res.json({ ok: true, skipped: "disabled" });
    if (config.lastRunAt && Date.now() - config.lastRunAt < SIX_HOURS_MS) {
      return res.json({ ok: true, skipped: "idempotent-window" });
    }

    const result = await generateEvidenceBoundDraft({ trigger: "scheduled" });
    await updateAutomationResult(config.id, JSON.stringify(result));
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[ScheduledReport] failed", error);
    return res.status(500).json({
      error: message,
      stack: error instanceof Error ? error.stack : undefined,
      context: { url: req.originalUrl, taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}
