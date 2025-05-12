import { createTRPCRouter, protectedProcedure } from "server/trpc";

export const roleRouter = createTRPCRouter({
  findAll: protectedProcedure.query(async ({ ctx }) => {
    const roles = await ctx.prisma.role.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    return roles;
  }),
});
