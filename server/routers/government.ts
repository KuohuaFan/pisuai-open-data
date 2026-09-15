import { z } from "zod";
import {
  getGovernmentCatalogOverview,
  getGovernmentDataset,
  listGovernmentDatasets,
  listGovernmentPublishers,
} from "../db";
import { publicProcedure, router } from "../_core/trpc";

export const governmentRouter = router({
  overview: publicProcedure.query(() => getGovernmentCatalogOverview()),
  list: publicProcedure
    .input(z.object({
      q: z.string().trim().max(120).optional(),
      category: z.string().max(100).optional(),
      publisher: z.string().max(240).optional(),
      page: z.number().int().min(1).max(10_000).default(1),
      pageSize: z.number().int().min(10).max(50).default(24),
    }))
    .query(({ input }) => listGovernmentDatasets(input)),
  publishers: publicProcedure
    .input(z.object({ q: z.string().trim().max(100).optional() }).default({}))
    .query(({ input }) => listGovernmentPublishers(input.q)),
  byId: publicProcedure
    .input(z.object({ datasetId: z.string().min(1).max(40) }))
    .query(({ input }) => getGovernmentDataset(input.datasetId)),
});
