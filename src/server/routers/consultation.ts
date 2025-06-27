// src/server/routers/consultationRouter.ts
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from 'server/trpc';
import { TRPCError } from '@trpc/server';

export const consultationRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        appointmentId: z.string(),
        reason: z.string().min(1),
        diagnosis: z.string().optional(),
        plan: z.string().optional(),
        notes: z.string().optional(),

        indications: z.array(
          z.object({
            instruction: z.string().min(1),
            notes: z.string().optional(),
          }),
        ),

        prescriptions: z.array(
          z.object({
            medication: z.string().min(1),
            dosage: z.string(),
            frequency: z.string(),
            duration: z.string(),
            route: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const doctorId = ctx?.session?.user?.doctorId;
      if (!doctorId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      // Verifica la cita
      const appointment = await ctx.prisma.appointment.findUnique({
        where: { id: input.appointmentId },
        include: { patient: true },
      });

      if (!appointment) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cita no encontrada.' });
      }

      // Crea la consulta y relaciones
      const consultation = await ctx.prisma.consultation.create({
        data: {
          appointmentId: input.appointmentId,
          patientId: appointment.patientId,
          doctorId,
          reason: input.reason,
          diagnosis: input.diagnosis,
          plan: input.plan??'',
          notes: input.notes,

          indications: {
            create: input.indications.map((ind) => ({
              instruction: ind.instruction,
              notes: ind.notes,
            })),
          },
          prescriptions: {
            create: input.prescriptions.map((rx) => ({
              medication: rx.medication,
              dosage: rx.dosage,
              frequency: rx.frequency,
              duration: rx.duration,
              route: rx.route,
            })),
          },
        },
      });

      return consultation;
    }),
});
