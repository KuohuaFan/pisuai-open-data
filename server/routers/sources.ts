import { z } from "zod";
import { getPublicSourceBySlug, listPublicSources, listSourceFacets } from "../db";
import { publicProcedure, router } from "../_core/trpc";

export const sourcesRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          q: z.string().trim().max(100).optional(),
          category: z.string().max(80).optional(),
          rightsClass: z.enum(["A", "B", "C", "D", "MIXED"]).optional(),
          limit: z.number().int().min(1).max(100).default(60),
        })
        .default({ limit: 60 }),
    )
    .query(({ input }) => listPublicSources(input)),
  facets: publicProcedure.query(() => listSourceFacets()),
  bySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1).max(180) }))
    .query(({ input }) => getPublicSourceBySlug(input.slug)),
});
