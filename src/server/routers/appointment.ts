import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "../../server/trpc";
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
      // Validar que la fecha no sea anterior a la fecha actual
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const appointmentDate = new Date(input.date.getFullYear(), input.date.getMonth(), input.date.getDate());
      
      if (appointmentDate < today) {
        throw new TRPCError({ 
          code: 'BAD_REQUEST',
          message: 'No se puede crear una cita en una fecha pasada.',
        });
      }

      const conflicting = await ctx.prisma.appointment.findFirst({
        where: {
          doctorId: input.doctorId,
          date: input.date,
          status: {
            in: ['completed', 'pending_payment'], // Solo citas pendientes o confirmadas
          }
        },
      });
      
      if (conflicting) {
        throw new TRPCError({ 
          code: 'CONFLICT',
          message: 'Ya existe una cita para este doctor en esta fecha y hora.',
        });
      }

      if (!ctx.session || !ctx.session.user || !ctx.session.user.patientId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Sesión inválida.' });
      }
      
      const appointment = await ctx.prisma.appointment.create({
        data: {
          patientId: ctx.session.user.patientId,
          doctorId: input.doctorId,
          specialtyId: input.specialtyId,
          date: input.date,
        },
      });
      
      return appointment;
    }),

  findByPatient: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.appointment.findMany({
      where: {
        patientId: ctx.session!.user.patientId!, 
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
          patientId: ctx.session!.user.patientId!, 
          
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

  markAsPaid: protectedProcedure
  .input(z.object({ appointmentId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const appointment = await ctx.prisma.appointment.update({
      where: { id: input.appointmentId },
      data: { status: 'confirmed' },
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
        specialty: true,
      },
    });

    const dateStr = appointment.date.toLocaleString('es-PE', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Lima',
    });

    await ctx.mailer.send({
    to: appointment.doctor.user.email,
    subject: 'Nueva cita confirmada',
    html: `
      <p>Hola Dr. ${appointment.doctor.user.name},</p>
      <p>El paciente <strong>${appointment.patient.user.name} ${appointment.patient.user.lastName}</strong> 
      ha reservado una cita para <strong>${appointment.specialty.name}</strong>.</p>
      <p><strong>Fecha y hora:</strong> ${dateStr}</p>
      <p>Por favor revise su agenda.</p>
    `,
    text: `Nueva cita confirmada para ${dateStr}`,
  });

    return {ok:true};
  }),

  findTakenSlots: protectedProcedure
  .input(z.object({ doctorId: z.string() }))
  .query(async ({ ctx, input }) => {
    const takenAppointments = await ctx.prisma.appointment.findMany({
      where: {
        doctorId: input.doctorId,
        status: {
          in: ['completed', 'pending_payment'], // Solo citas pendientes o confirmadas
        },
      },
      select: {
        date: true,
      },
    });

    return takenAppointments.map(appointment => appointment.date);
  }),

 findDoctorAppointmentsByDate: protectedProcedure
  .input(z.object({ date: z.date() }))
  .query(async ({ ctx, input }) => {
    const doctorId = ctx.session?.user?.doctorId;
    if (!doctorId) throw new TRPCError({ code: 'UNAUTHORIZED' });

    // Crear fechas en UTC para evitar problemas de zona horaria
    const inputDate = new Date(input.date);
    
    // Obtener año, mes y día de la fecha seleccionada
    const year = inputDate.getFullYear();
    const month = inputDate.getMonth();
    const day = inputDate.getDate();
    
    // Crear fechas específicas sin interferencia de zona horaria
    const startOfDay = new Date(year, month, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month, day, 23, 59, 59, 999);

    console.log('Fecha seleccionada:', inputDate.toISOString());
    console.log('Inicio del día:', startOfDay.toISOString());
    console.log('Fin del día:', endOfDay.toISOString());

    return await ctx.prisma.appointment.findMany({
      where: {
        doctorId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['completed', 'confirmed'],
        }
      },
      include: {
        patient: {
          include: {
            user: true,
            clinicalHistory: {
              orderBy: { date: 'desc' },
              take: 1,
            },
          },
        },
        specialty: true,
      },
      orderBy: { date: 'asc' },
    });
  }),
});

