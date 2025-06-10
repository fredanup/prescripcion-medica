import { createTRPCRouter, protectedProcedure } from "server/trpc";


export const specialtyRouter = createTRPCRouter({

  findAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.specialty.findMany({
        orderBy: {name: 'asc'}
    });
  }),
});
