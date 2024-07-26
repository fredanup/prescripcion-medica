import { createTRPCRouter, protectedProcedure } from "server/trpc";
import { createApplicationSchema } from "utils/auth";
import { z } from "zod";

export const applicationRouter = createTRPCRouter({
  // Listar a los usuarios con su sucursal adjunta
  findCallApplications: protectedProcedure.input(
    z.object({
      callingId: z.string(),
    })
  ).query(async ({ ctx, input }) => {
    const { callingId } = input;
    try {
      const callingApplications = await ctx.prisma.jobApplication.findMany({
        where: {
          callingId: callingId,
        },
      });
      return callingApplications;
    } catch (error) {
      console.error("Error fetching calling applications:", error);
      throw new Error("Error fetching calling applications");
    }
  }),

  findMyApplications: protectedProcedure
  .query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new Error('Not authenticated');
    }
    try {
      const myApplications = await ctx.prisma.jobApplication.findMany({
        select:{
          id:true,
          postulantId: true,
          callingId: true,
        },
        where: {
          postulantId:ctx.session?.user?.id
        },
      });
      return myApplications;
    } catch (error) {
      console.error("Error fetching my applications:", error);
      throw new Error("Error fetching my applications");
    }
  }),

  createApplication: protectedProcedure.input(
    createApplicationSchema
  ).mutation(async ({ ctx, input }) => {
    const { postulantId, callingId } = input;
    try {
      await ctx.prisma.jobApplication.create({
        data: {
          postulantId: postulantId,
          callingId: callingId,
        },
      });
      return { success: true };
    } catch (error) {
      console.error("Error creating application:", error);
      throw new Error("Error creating application");
    }
  }),
});
