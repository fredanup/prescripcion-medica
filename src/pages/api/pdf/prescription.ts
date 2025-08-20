// src/pages/api/pdf/prescription.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { prisma } from 'server/prisma';
import { getServerAuthSession } from 'server/auth'; // o tu helper equivalente basado en getServerSession
import { buildPrescriptionPdfBuffer } from 'server/pdfs';

type TokenPayload = { consultationId: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { consultationId: cidFromQuery, token } = req.query as {
      consultationId?: string;
      token?: string;
    };

    let consultationId = cidFromQuery;

    // 1) Intento con token público
    let accessMode: 'public-token' | 'doctor-session' | 'patient-session' | null = null;
    if (token) {
      const secret = process.env.SIGN_SECRET;
      if (!secret) return res.status(500).end('Server misconfigured (SIGN_SECRET)');

      try {
        const payload = jwt.verify(token, secret) as TokenPayload;
        consultationId = payload.consultationId;
        accessMode = 'public-token';
      } catch {
        return res.status(401).end('Invalid or expired token');
      }
    }

    // 2) Si no hubo token, intentamos sesión (doctor o paciente)
    let doctorId: string | undefined;
    let patientId: string | undefined;

    if (!accessMode) {
      const session = await getServerAuthSession({ req, res }); // ajusta al helper que uses
      doctorId = (session as any)?.user?.doctorId ?? undefined;
      patientId = (session as any)?.user?.patientId ?? undefined;

      if (doctorId) accessMode = 'doctor-session';
      else if (patientId) accessMode = 'patient-session';
      else return res.status(401).end('Unauthorized');
    }

    if (!consultationId) return res.status(400).end('Missing consultationId');

    // 3) Filtro por modo de acceso
    const whereByMode =
      accessMode === 'doctor-session'
        ? { id: consultationId, doctorId } // debe ser el médico dueño
        : accessMode === 'patient-session'
        ? { id: consultationId, patientId } // debe ser el paciente dueño
        : { id: consultationId }; // token público: sólo por id

    const c = await prisma.consultation.findFirst({
      where: whereByMode,
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        indications: true,
        prescriptions: true,
        appointment: { include: { specialty: true } },
      },
    });

    if (!c) return res.status(404).end('Not found');

    const pdf = await buildPrescriptionPdfBuffer(c);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=prescripcion-${consultationId}.pdf`);
    res.status(200).send(pdf);
  } catch (err) {
    console.error(err);
    res.status(500).end('Internal error');
  }
}
