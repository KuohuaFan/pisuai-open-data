import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { adminRouter } from "./routers/admin";
import { governmentRouter } from "./routers/government";
import { memberRouter } from "./routers/member";
import { reportsRouter } from "./routers/reports";
import { sourcesRouter } from "./routers/sources";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  sources: sourcesRouter,
  government: governmentRouter,
  reports: reportsRouter,
  member: memberRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
