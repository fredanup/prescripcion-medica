// src/server/routers/authRouter.ts
import {  createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const authRouter = createTRPCRouter({
  getDashboardRoute: protectedProcedure.query(({ ctx }) => {
    const role = ctx.session?.user?.role;

    if (!role) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No role found' });

    const routes: Record<string, string> = {
      admin: '/dashboard/users',
      doctor: '/dashboard/callings',
      pharmacist: '/dashboard/medications',
      patient: '/dashboard/profile',
      laboratory_staff: '/dashboard/results',
    };

    return routes[role] || '/';
  }),
});
