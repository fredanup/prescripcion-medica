/**
 * This file contains the root router of your tRPC-backend
 */
import { publicProcedure, createTRPCRouter } from '../trpc';
import { postRouter } from './post';
import { observable } from '@trpc/server/observable';
import { clearInterval } from 'timers';
import { userRouter } from './user';
import { branchRouter } from './branch';
import { documentRouter } from './document';
import { callingRouter } from './calling';
import { authRouter } from './authRouter';
import { roleRouter } from './role';
import { appointmentRouter } from './appointment';
import { specialtyRouter } from './specialty';
import { doctorRouter } from './doctor';
import { consultationRouter } from './consultation';
import { clinicalHistoryRouter } from './clinicalHistory';

export const appRouter = createTRPCRouter({
  healthcheck: publicProcedure.query(() => 'yay!'),
  auth: authRouter,
  user: userRouter,
  branch: branchRouter,
  document: documentRouter,
  calling:callingRouter,
  post: postRouter,
  role: roleRouter,
  appointment: appointmentRouter,
  specialty: specialtyRouter,
  doctor: doctorRouter,
  consultation: consultationRouter,
  clinicalHistory: clinicalHistoryRouter,
  randomNumber: publicProcedure.subscription(() => {
    return observable<number>((emit) => {
      const int = setInterval(() => {
        emit.next(Math.random());
      }, 500);
      return () => {
        clearInterval(int);
      };
    });
  }),
});

export type AppRouter = typeof appRouter;
