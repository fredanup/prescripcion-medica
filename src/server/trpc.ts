import type { Context } from './context';
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const mergeRouters = t.mergeRouters;


export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  const user = ctx.session?.user;

  if (!user?.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  // 👇 MUY IMPORTANTE: mergear el ctx, no reemplazarlo
  return next({
    ctx: {
      ...ctx,        // conserva prisma, s3, mailer, pdfs, etc.
      user,          // añade una propiedad conveniente
    },
  });
});
