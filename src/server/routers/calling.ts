import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { prisma } from '../prisma';
import { createCallingSchema, editCallingSchema } from '../../utils/auth';
import { z } from 'zod';

export const callingRouter = createTRPCRouter({
  //Listar a los usuarios con su sucursal adjunta
  findManyCalling: publicProcedure.query(async () => {
    const callings = await prisma.calling.findMany();
    return callings;
  }),
  findYourCallings: publicProcedure
  .query(async ({  }) => {
    const callings = await prisma.calling.findMany({
      select: {
        id:true,
        requirement: true,        
        min_exp_work:true,
        resultAt:true,
        expiresAt:true,
      },
      /*
      where: {
        userId: ctx.session?.user?.id,
      },
      */
    });
    return callings;
  }),
 
  findAvailableCallings: publicProcedure
  .query(async ({ }) => {
    const availableCallings = await prisma.calling.findMany({
      select: {
        id:true,
        requirement: true,        
        min_exp_work:true,
        resultAt:true,
        expiresAt:true,
      },
      where: {
        expiresAt: {
          gte: new Date(),
        },
      },
    });
    return availableCallings;
  }),

  createCalling: publicProcedure.input(createCallingSchema)
  .mutation(async ({ ctx, input }) => {
    try {
      
      await ctx.prisma.calling.create({          
        data: {                
            requirement:input.requirement,
            min_exp_work:input.min_exp_work,    
            userId:ctx.session?.user?.id,
            resultAt:input.resultAt,
            expiresAt:input.expiresAt            
        },
      });
    } catch (error) {
      console.log(error);
    }
  }),
  updateCalling: protectedProcedure
  .input(editCallingSchema)
  .mutation(async ({ ctx, input }) => {
    try {
      await ctx.prisma.calling.update({
        where: { id: input.id },
        data: {                
            requirement:input.requirement,
            min_exp_work:input.min_exp_work,    
            userId:ctx.session?.user?.id,
            resultAt:input.resultAt,
            expiresAt:input.expiresAt      
        },
      });
    } catch (error) {
      console.log(error);
    }
  }),
  deleteOneCalling: publicProcedure.input(z.object({
    id: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    try {
      
      await ctx.prisma.calling.delete({          
        where: { id: input.id },
      });
    } catch (error) {
      console.log(error);
    }
  }),
});