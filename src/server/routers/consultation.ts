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

       console.log('[consultationRouter.create] Input recibido:', JSON.stringify(input, null, 2));

      const doctorId = ctx?.session?.user?.doctorId;
      console.log('[consultationRouter.create] doctorId:', doctorId);

     if (!doctorId) {
        console.error('[consultationRouter.create] No hay doctorId en la sesión');
        throw new TRPCError({ 
          code: 'UNAUTHORIZED', 
          message: 'No se encontró el ID del doctor en la sesión' 
        });
      }

      try {
         console.log('[consultationRouter.create] Buscando appointment:', input.appointmentId);
        // Verifica la cita
        const appointment = await ctx.prisma.appointment.findUnique({
          where: { id: input.appointmentId },
          include: { patient: true },
        });
        if (!appointment) {
          console.error('[consultationRouter.create] Appointment no encontrado:', input.appointmentId);
          throw new TRPCError({ 
            code: 'NOT_FOUND', 
            message: `Cita con ID ${input.appointmentId} no encontrada.` 
          });
        }
        console.log('[consultationRouter.create] Appointment encontrado:', appointment.id);

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
    
        // 2. Actualizar el estado de la cita
        await ctx.prisma.appointment.update({
          where: { id: input.appointmentId },
          data: {
            status: 'completed', // o el estado que uses para citas completadas
            // También puedes actualizar otros campos como:
            // completedAt: new Date(),
            // actualEndTime: new Date(),
          }
        });
        return consultation;
      }
      catch (error) {
        console.error('[consultationRouter.create] Error al crear consulta:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al crear la consulta. Por favor, inténtelo de nuevo más tarde.',
        });
      }     
    }),
});
