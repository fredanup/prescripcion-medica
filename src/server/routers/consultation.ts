// src/server/routers/consultationRouter.ts
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../../server/trpc';
import { TRPCError } from '@trpc/server';
import jwt from 'jsonwebtoken';

const SeverityEnum = z.enum(['mild', 'moderate', 'severe']);
const OrderTypeEnum = z.enum(['lab', 'imaging']);          // mapea a MedicalOrderType (laboratory | imaging)
const OrderPriorityEnum = z.enum(['normal', 'urgent']);    // mapea a MedicalOrderPriority

export const consultationRouter = createTRPCRouter({
  /**
   * 1) Crear consulta (NO cierra la cita; retorna { id } para encadenar diagnóstico/órdenes)
   */
  create: protectedProcedure
    .input(
      z.object({
        appointmentId: z.string(),
        reason: z.string().min(1),
        diagnosis: z.string().optional(),     // libre
        plan: z.string().optional(),          // si en Prisma es requerido, default ''
        notes: z.string().optional(),

        indications: z.array(
          z.object({
            instruction: z.string().min(1),
            notes: z.string().optional(),
          }),
        ).default([]),

        prescriptions: z.array(
          z.object({
            medication: z.string().min(1),
            dosage: z.string().optional().default(''),
            frequency: z.string().optional().default(''),
            duration: z.string().optional().default(''),
            route: z.string().optional().default(''),
          }),
        ).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      console.log('[consultationRouter.create] Input:', JSON.stringify(input, null, 2));

      const doctorId = ctx?.session?.user?.doctorId as string | undefined;
      console.log('[consultationRouter.create] doctorId:', doctorId);

      if (!doctorId) {
        console.error('[consultationRouter.create] No hay doctorId en la sesión');
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No se encontró el ID del doctor en la sesión',
        });
      }
      
      try {

        
        // 1) Verificar cita
        const appointment = await ctx.prisma.appointment.findUnique({
          where: { id: input.appointmentId },
          select: { id: true, patientId: true, doctorId: true, status: true },
        });
        if (!appointment) {
          console.error('[consultationRouter.create] Appointment no encontrado:', input.appointmentId);
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Cita con ID ${input.appointmentId} no encontrada.`,
          });
        }
        if (appointment.doctorId !== doctorId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'La cita pertenece a otro doctor' });
        }

        // 2) ¿Ya existe consulta para esta cita?
        const existing = await ctx.prisma.consultation.findFirst({
          where: { appointmentId: appointment.id, doctorId },
          select: { id: true },
        });

        if(!existing){
          // 2) Crear consulta y relaciones
          const created = await ctx.prisma.consultation.create({
            data: {
              appointmentId: appointment.id,
              patientId: appointment.patientId,
              doctorId,
              reason: input.reason,
              diagnosis: input.diagnosis ?? null,
              plan: input.plan ?? '',
              notes: input.notes ?? null,
              // status por default = in_progress (según schema propuesto)
              indications: {
                create: input.indications.map((ind) => ({
                  instruction: ind.instruction,
                  notes: ind.notes ?? null,
                })),
              },
              prescriptions: {
                create: input.prescriptions.map((rx) => ({
                  medication: rx.medication,
                  dosage: rx.dosage ?? '',
                  frequency: rx.frequency ?? '',
                  duration: rx.duration ?? '',
                  route: rx.route ?? '',
                })),
              },
            },
            select: { id: true },
          });

          return created; 
        }
        await ctx.prisma.$transaction(async (tx) => {
        await tx.medicalIndication.deleteMany({ where: { consultationId: existing.id } });
        await tx.medicationPrescription.deleteMany({ where: { consultationId: existing.id } });

        // actualizar campos base + volver a crear arrays
        await tx.consultation.update({
          where: { id: existing.id },
          data: {
            reason: input.reason,
            diagnosis: input.diagnosis ?? null,
            plan: input.plan ?? '',
            notes: input.notes ?? null,
            indications: {
              create: input.indications.map(i => ({ instruction: i.instruction, notes: i.notes ?? null })),
            },
            prescriptions: {
              createMany: {
                data: input.prescriptions.map(rx => ({
                  medication: rx.medication,
                  dosage: rx.dosage ?? '',
                  frequency: rx.frequency ?? '',
                  duration: rx.duration ?? '',
                  route: rx.route ?? '',
                })),
                skipDuplicates: true,
              },
            },
          },
        });

        return { id: existing.id };
      });
        

      } catch (error) {
        console.error('[consultationRouter.create] Error al crear consulta:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al crear la consulta. Por favor, inténtelo de nuevo más tarde.',
        });
      }
      
    }),

  /**
   * 2) Guardar diagnósticos estructurados (ConsultationDiagnosis[])
   */
  createDiagnosis: protectedProcedure
    .input(
      z.object({
        consultationId: z.string().min(1),
        items: z.array(
          z.object({
            code: z.string().optional(),
            label: z.string().min(1),
            severity: SeverityEnum.optional(),
            notes: z.string().optional(),
          })
        ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userDoctorId = ctx?.session?.user?.doctorId as string | undefined;
      if (!userDoctorId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      // Verificar autoría
      const owns = await ctx.prisma.consultation.findFirst({
        where: { id: input.consultationId, doctorId: userDoctorId },
        select: { id: true },
      });
      if (!owns) throw new TRPCError({ code: 'FORBIDDEN', message: 'No autorizado' });

        // Limpia y vuelve a crear (idempotente simple)
     await ctx.prisma.$transaction(async (tx) => {
        await tx.consultationDiagnosis.deleteMany({ where: { consultationId: input.consultationId } });
        await tx.consultationDiagnosis.createMany({
          data: input.items.map(d => ({
            consultationId: input.consultationId,
            code: d.code ?? null,
            label: d.label,
            severity: d.severity ?? null,
            notes: d.notes ?? null,
          })),
          skipDuplicates: true, // efectivo con @@unique([consultationId, label, code])
        });
      });

      return { ok: true };
    }),

  /**
   * 3) Crear órdenes (MedicalOrder[]) con status/p priority (enums)
   */
  createOrders: protectedProcedure
    .input(
      z.object({
        consultationId: z.string().min(1),
        orders: z.array(
          z.object({
            type: OrderTypeEnum,                  // 'lab' | 'imaging' → MedicalOrderType
            code: z.string().optional(),
            label: z.string().min(1),
            priority: OrderPriorityEnum.optional(), // 'normal' | 'urgent'
            notes: z.string().optional(),
          })
        ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userDoctorId = ctx?.session?.user?.doctorId as string | undefined;
      if (!userDoctorId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const c = await ctx.prisma.consultation.findFirst({
        where: { id: input.consultationId, doctorId: userDoctorId },
        select: { id: true, patientId: true, doctorId: true },
      });
      if (!c) throw new TRPCError({ code: 'FORBIDDEN', message: 'No autorizado' });

      await ctx.prisma.$transaction(async (tx) => {
        await tx.medicalOrder.deleteMany({ where: { consultationId: c.id } });
        await ctx.prisma.medicalOrder.createMany({
          data: input.orders.map((o) => ({
            consultationId: input.consultationId,
            patientId: c.patientId,
            doctorId: c.doctorId,
            area: o.type === 'lab' ? 'laboratory' : 'imaging',
            description: [o.label, o.code ? `(${o.code})` : '', o.notes ? `- ${o.notes}` : ''].filter(Boolean).join(' '),
            status: 'pending',                         // enum en Prisma
            priority: o.priority ?? 'normal',          // enum en Prisma
            results: null,
            resultFile: null,
            })),
            skipDuplicates: true,
          })
      });


      // (opcional) notificar a laboratorio
      return { ok: true };
    }),

  /**
   * 4) Guardar borrador (opcional)
   */
  saveDraft: protectedProcedure
    .input(z.object({
      consultationId: z.string().nullable().optional(),
      partial: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!input.consultationId) return { ok: true };
      // ejemplo: guardar algo en notes; ajusta a tu gusto
      await ctx.prisma.consultation.update({
        where: { id: input.consultationId },
        data: { /* notes: 'draft…' */ },
      });
      return { ok: true };
    }),

  /**
   * 5) Cerrar atención (status = completed, closedAt = now)
   *    Opcional: marcar Appointment.completed
   */
  close: protectedProcedure
    .input(
      z.object({
        consultationId: z.string().min(1),
        completeAppointment: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userDoctorId = ctx?.session?.user?.doctorId as string | undefined;
      if (!userDoctorId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const c = await ctx.prisma.consultation.findFirst({
        where: { id: input.consultationId, doctorId: userDoctorId },
        select: { id: true, appointmentId: true },
      });
      if (!c) throw new TRPCError({ code: 'FORBIDDEN', message: 'No autorizado' });

      await ctx.prisma.$transaction(async (tx) => {
        await tx.consultation.update({
          where: { id: input.consultationId },
          data: { status: 'completed', closedAt: new Date() },
        });

        // Si quieres cerrar también la cita
        const apptId = c.appointmentId ?? input.completeAppointment;
        if (apptId) {
          await tx.appointment.update({
            where: { id: apptId },
            data: { status: 'completed' },
          });
        }
      });

      // (opcional) notificación a paciente / laboratorio / farmacia
      return { ok: true };
    }),

  /**
   * 6) (Opcional) Resumen para la pestaña "Resumen"
   */
  getSummary: protectedProcedure
    .input(z.object({ consultationId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const userDoctorId = ctx?.session?.user?.doctorId as string | undefined;
      if (!userDoctorId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const data = await ctx.prisma.consultation.findFirst({
        where: { id: input.consultationId, doctorId: userDoctorId },
        include: {
          indications: true,
          prescriptions: true,
          medicalOrders: true,
          patient: { include: { user: true } },
          doctor:  { include: { user: true } },
          consultationDiagnosis: true, // nombre de la relación en Prisma
          appointment:{
            include: {
              specialty: true, // incluye especialidad si existe
            },
          }
        },
      });
      if (!data) throw new TRPCError({ code: 'FORBIDDEN', message: 'No autorizado' });

      return data;
    }),
  deliver: publicProcedure
    .input(z.object({ consultationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const consultation = await ctx.prisma.consultation.findUnique({
        where: { id: input.consultationId },
       include: {
          patient: { include: { user: true } },
          doctor:  { include: { user: true } },
          indications: true,
          prescriptions: true,
          appointment: { include: { specialty: true } },
        },
      });

      if (!consultation) throw new Error("Consulta no encontrada");
      if (!consultation.patient?.user?.email) throw new Error("Paciente sin email");

      // generar PDF como Buffer (con helper que tú defines usando PDFKit)
      const pdfBuffer = await ctx.pdfs.prescription(consultation);

      // enviar email al paciente
      await ctx.mailer.send({
        to: consultation.patient.user.email,
        subject: "Indicaciones y Prescripción",
        html: `
          <p>Hola ${consultation.patient.user.name ?? ""},</p>
          <p>Adjuntamos su <strong>prescripción médica</strong>.</p>
        `,
        text: "Adjuntamos su prescripción médica.",
        attachments: [{ filename: "prescripcion.pdf", content: pdfBuffer }],
      });

      return { success: true };
    }),
    getPrescriptionBundle: publicProcedure
    .input(z.object({ consultationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const consultation = await ctx.prisma.consultation.findUnique({
        where: { id: input.consultationId },
        include: {
          patient: { include: { user: true } },
          prescriptions: true,
        },
      });

      if (!consultation) throw new Error("Consulta no encontrada");

      // firmamos un token para acceso público farmacia
      const token = jwt.sign(
        { consultationId: consultation.id },
        process.env.SIGN_SECRET!,
        { expiresIn: "7d" }
      );

      const url = `${process.env.APP_URL}/api/pdf/prescription?token=${token}`;

      return {
        consultationId: consultation.id,
        patient: {
          name: consultation.patient?.user?.name,
          lastName: consultation.patient?.user?.lastName,
        },
        prescriptions: consultation.prescriptions,
        url, // link directo
        qrData: url, // el frontend puede generar un QR a partir de este string
      };
    }),
    findPatientHistory: protectedProcedure.query(async ({ ctx }) => {
    const patientId = ctx.session?.user?.patientId;
    if (!patientId) throw new Error("No tienes rol de paciente");

    const consultations = await ctx.prisma.consultation.findMany({
      where: { patientId },
      include: {
        doctor: { include: { user: true, Specialty: true } },
        indications: true,
        prescriptions: true,
        appointment: { include: { specialty: true } },
      },
      orderBy: { date: "desc" },
    });

    return consultations;
  }),
});
