import { z } from "zod";
import {
  getMemberLibrary,
  toggleReportBookmark,
  toggleSourceBookmark,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const memberRouter = router({
  library: protectedProcedure.query(({ ctx }) => getMemberLibrary(ctx.user.id)),
  toggleSource: protectedProcedure
    .input(z.object({ sourceId: z.number().int().positive() }))
    .mutation(({ ctx, input }) => toggleSourceBookmark(ctx.user.id, input.sourceId)),
  toggleReport: protectedProcedure
    .input(z.object({ reportId: z.number().int().positive() }))
    .mutation(({ ctx, input }) => toggleReportBookmark(ctx.user.id, input.reportId)),
});
