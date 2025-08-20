// src/server/routers/clinicalHistoryRouter.ts
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../../server/trpc';
import { IListMyPatientsOutput, ITimelineOutput, ListMyPatientsOutput, TimelineOutputSchema } from '../../utils/auth';
import { Prisma } from '@prisma/client';




// ...

export const clinicalHistoryRouter = createTRPCRouter({
 listMyPatients: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),             // nombre/apellido/email
        orderByLastContact: z.boolean().optional() // si true, ordena por último contacto desc
      }).optional()
    )
    .output(ListMyPatientsOutput)
    .query(async ({ ctx, input }) => {
      const doctorId = ctx.session?.user?.doctorId;
      if (!doctorId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      // ✅ Incluir relaciones con los nombres EXACTOS del schema:
      // user, consultations, Appointment (A mayúscula)
      const patientWithRels = Prisma.validator<Prisma.PatientDefaultArgs>()({
        include: {
          user: {
            select: { id: true, name: true, lastName: true, image: true, email: true },
          },
          consultations: {
            where: { doctorId },
            orderBy: { date: 'desc' },
            take: 1,
            select: { date: true },
          },
          Appointment: { // <-- Así se llama en tu schema
            where: {
              doctorId,
              OR: [
                { paidAt: { not: null } },
                { status: { in: ["confirmed", "completed"] } },
              ],
            },
            orderBy: { date: 'desc' },
            take: 1,
            select: { date: true },
          },
        },
      });
     

      const whereBase: Prisma.PatientWhereInput = {
        OR: [
          {
            Appointment: {
              some: {
                doctorId,
                OR: [
                  { paidAt: { not: null } },
                  { status: "completed" },
                ],
              },
            },
          },
          { consultations: { some: { doctorId } } },
        ],
        ...(input?.search
          ? {
              user: {
                OR: [
                  { name: { contains: input.search, mode: 'insensitive' } },
                  { lastName: { contains: input.search, mode: 'insensitive' } },
                  { email: { contains: input.search, mode: 'insensitive' } },
                ],
              },
            }
          : {}),
      };

      const patients = await ctx.prisma.patient.findMany({
        where: whereBase,
        ...patientWithRels,
        orderBy: input?.orderByLastContact ? undefined : { user: { name: 'asc' } },
      });

      const mapped: IListMyPatientsOutput = patients.map((p) => {
        const lastDateMs = Math.max(
          p.consultations[0]?.date?.getTime() ?? 0,
          p.Appointment[0]?.date?.getTime() ?? 0
        );
        return {
          id: p.id,
          userId: p.user.id,
          name: p.user.name,
          lastName: p.user.lastName,
          image: p.user.image,
          email: p.user.email,
          lastContactAt: lastDateMs ? new Date(lastDateMs) : null,
        };
      });

      if (input?.orderByLastContact) {
        mapped.sort((a, b) => (b.lastContactAt?.getTime() ?? 0) - (a.lastContactAt?.getTime() ?? 0));
      }

      return mapped;
    }),
  timeline: protectedProcedure
    .input(z.object({
      patientId: z.string().min(1),
      cursor: z.string().nullish(),  // ISO date string
      limit: z.number().min(10).max(50).default(20),
    }))
    // --- NUEVO: declara el output (opcional pero recomendado)
    .output(TimelineOutputSchema)
    .query(async ({ ctx, input }): Promise<ITimelineOutput> => {
      const doctorId = ctx.session?.user?.doctorId;
      if (!doctorId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      // Seguridad: relación doctor-paciente
      const hasRelation = await ctx.prisma.patient.findFirst({
        where: {
          id: input.patientId,
          OR: [
            { Appointment: { some: { doctorId } } },
            { consultations: { some: { doctorId } } },
          ],
        },
        select: { id: true },
      });
      if (!hasRelation) throw new TRPCError({ code: 'FORBIDDEN' });

      const toDate = input.cursor ? new Date(input.cursor) : new Date();
      const take = input.limit + 1; // --- NUEVO: pedir uno extra por tipo

      const [consultations, orders] = await Promise.all([
        ctx.prisma.consultation.findMany({
          where: { patientId: input.patientId, doctorId, date: { lte: toDate } },
          orderBy: { date: 'desc' },
          take,
          include: {
            consultationDiagnosis: true,
            indications: true,
            prescriptions: true,
            appointment: { include: { specialty: true } },
          },
        }),
        ctx.prisma.medicalOrder.findMany({
          where: { patientId: input.patientId, doctorId, date: { lte: toDate } },
          orderBy: { date: 'desc' },
          take,
        }),
      ]);

      // --- NUEVO: construir con literales 'as const' para no ensanchar 'kind'
      const consultationItems = consultations.map(c => ({
        kind: 'consultation' as const,
        id: c.id,
        date: c.date,
        data: c,
      }));

      const orderItems = orders.map(o => ({
        kind: 'order' as const,
        id: o.id,
        date: o.date,
        data: o,
      }));

      const combined = [...consultationItems, ...orderItems].sort(
        (a, b) => b.date.getTime() - a.date.getTime()
      );

      // tomar solo 'limit' elementos
      const items = combined.slice(0, input.limit);
      // hay más si el total combinado supera el límite
      const hasMore = combined.length > input.limit;
      const nextCursor = hasMore ? items[items.length - 1]?.date.toISOString() ?? null : null;

      return { items, nextCursor };
    }),

  // ... getConsultationSummary igual ...
});
