import type { CreateNextContextOptions } from '@trpc/server/adapters/next';
import type { CreateWSSContextFnOptions } from '@trpc/server/adapters/ws';
import { getServerSession } from 'next-auth';
import type { NextApiRequest, NextApiResponse } from 'next';
import { authOptions } from '../pages/api/auth/[...nextauth]';
import { prisma } from './prisma';
import { s3 } from './aws/s3';
import { sendMail } from './email/mailer';
import { buildPrescriptionPdfBuffer } from './pdfs';

export const createContext = async (
  opts: CreateNextContextOptions | CreateWSSContextFnOptions,
) => {
  let session = null;
  
  // Para HTTP requests (tRPC HTTP)
  if ('req' in opts && 'res' in opts) {
    // Verificar que realmente son objetos HTTP válidos
    const req = opts.req as NextApiRequest;
    const res = opts.res as NextApiResponse;
    
    // Solo usar getServerSession si res tiene los métodos necesarios
    if (typeof res?.getHeader === 'function') {
      session = await getServerSession(req, res, authOptions);
    }
  }
  
  // Para WebSocket connections
  if ('info' in opts) {
    console.log('WebSocket connection context');
    
    // Obtener authorization del connectionParams
    const authorization = opts.info.connectionParams?.authorization;
    
    if (authorization && typeof authorization === 'string') {
      const token = authorization.replace('Bearer ', '');
      
      try {
        // Verificar si el token corresponde a un usuario válido
        const user = await prisma.user.findUnique({
          where: { id: token },
          include: {
            UserRole: { include: { role: true } },
            Doctor: { select: { id: true } },
            Patient: { select: { id: true } },
            Pharmacist: { select: { id: true } },
            LaboratoryStaff: { select: { id: true } },
          },
        });
        
        if (user) {
          const roles = user.UserRole.map((ur) => ur.role.name);
          
          // Simular estructura de session
          session = {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              roles,
              activeRole: roles[0] ?? null,
              doctorId: user.Doctor?.id ?? null,
              patientId: user.Patient?.id ?? null,
              pharmacistId: user.Pharmacist?.id ?? null,
              labStaffId: user.LaboratoryStaff?.id ?? null,
            },
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
          };
        }
      } catch (error) {
        console.error('Error verificando WebSocket auth:', error);
        // session permanece null
      }
    }
  }

  console.log('createContext for', session?.user?.name ?? 'unknown user');

  return {
    session,
    prisma,
    s3,
    mailer: { send: sendMail },
    pdfs: { prescription: buildPrescriptionPdfBuffer },
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;