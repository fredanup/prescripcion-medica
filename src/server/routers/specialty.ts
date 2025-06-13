import { createTRPCRouter, protectedProcedure } from "server/trpc";


export const specialtyRouter = createTRPCRouter({

  findAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.specialty.findMany({
        orderBy: {name: 'asc'}
    });
  }),
  getAllWithPrice: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.specialty.findMany({
        select :{
          id: true,
          name:true,
          price:true
        },
        orderBy: {name: 'asc'}
    });
  }),
});
