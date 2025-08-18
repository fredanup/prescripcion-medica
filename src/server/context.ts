import type { CreateNextContextOptions } from '@trpc/server/adapters/next';
import type { CreateWSSContextFnOptions } from '@trpc/server/adapters/ws';
import { getSession } from 'next-auth/react';
import { prisma } from './prisma';
import { s3 } from './aws/s3';
import { sendMail } from './email/mailer';
import { buildPrescriptionPdfBuffer } from './pdfs';
/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/v11/context
 */
export const createContext = async (
  opts: CreateNextContextOptions | CreateWSSContextFnOptions,
) => {
  const session = await getSession(opts);

  console.log('createContext for', session?.user?.name ?? 'unknown user');

  return {
    session,
    prisma,
    s3,
    mailer:{send: sendMail},
    pdfs:{prescription:buildPrescriptionPdfBuffer},
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
