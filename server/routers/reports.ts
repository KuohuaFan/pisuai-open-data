import { z } from "zod";
import { getPublishedReportBySlug, listPublishedReports } from "../db";
import { publicProcedure, router } from "../_core/trpc";

export const reportsRouter = router({
  list: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(60).default(24) }).default({ limit: 24 }))
    .query(({ input }) => listPublishedReports(input.limit)),
  bySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1).max(200) }))
    .query(({ input }) => getPublishedReportBySlug(input.slug)),
});
