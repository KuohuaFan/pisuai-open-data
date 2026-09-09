import { z } from "zod";
import {
  getAdminOverview,
  getAutomationConfig,
  listAdminReports,
  listAdminSources,
  listIngestionRuns,
  updateReportStatus,
  updateSourceGovernance,
} from "../db";
import { generateEvidenceBoundDraft } from "../reportGenerator";
import { adminProcedure, router } from "../_core/trpc";

export const adminRouter = router({
  overview: adminProcedure.query(() => getAdminOverview()),
  sources: adminProcedure.query(() => listAdminSources()),
  reports: adminProcedure.query(() => listAdminReports()),
  runs: adminProcedure.query(() => listIngestionRuns()),
  automation: adminProcedure.query(() => getAutomationConfig()),
  updateSource: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        rightsClass: z.enum(["A", "B", "C", "D", "MIXED"]).optional(),
        status: z.enum(["active", "review", "paused", "withdrawn"]).optional(),
        isPublic: z.boolean().optional(),
        featured: z.boolean().optional(),
        riskNote: z.string().max(4000).nullable().optional(),
        attribution: z.string().max(4000).nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { id, ...patch } = input;
      return updateSourceGovernance(id, patch, ctx.user.id);
    }),
  generateDraft: adminProcedure.mutation(({ ctx }) =>
    generateEvidenceBoundDraft({ trigger: "manual", actorUserId: ctx.user.id }),
  ),
  updateReportStatus: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        status: z.enum(["draft", "review", "published", "withdrawn"]),
        reviewNote: z.string().max(4000).optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      updateReportStatus(input.id, input.status, ctx.user.id, input.reviewNote),
    ),
});
