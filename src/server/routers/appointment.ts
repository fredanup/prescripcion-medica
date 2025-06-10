import { createTRPCRouter, protectedProcedure } from "server/trpc";
import { z } from "zod";

export const appointmentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      doctorId: z.string(),
      specialtyId: z.string(),
      date: z.date(),
      notes: z.string().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.appointment.create({
        data: {
          patientId: ctx.session?.user?.patientId??"",
          doctorId: input.doctorId,
          specialtyId: input.specialtyId,
          date: input.date,
          
        },
      });
    }),

  findByPatient: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.appointment.findMany({
      where: {
        patientId: ctx.session?.user?.patientId??undefined, 
      },
      include: {
        doctor: true,
        specialty: true,
      },
      orderBy: { date: 'asc' },
    });
  }),


  findMyAppointments: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.appointment.findMany({
        where: {
                  patientId: ctx.session?.user?.patientId??undefined, 
          
        },
        include: {
          doctor: {
            include: {
              user: true,
            },
          },
          specialty: true,
        },
        orderBy: {
          date: 'asc',
        },
      });
    }),
});
