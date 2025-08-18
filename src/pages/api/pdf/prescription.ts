// src/pages/api/pdf/prescription.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { prisma } from 'server/prisma';
import { getServerAuthSession } from 'server/auth';
import { buildPrescriptionPdfBuffer } from 'server/pdfs';

type TokenPayload = { consultationId: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { consultationId: cidFromQuery, token } = req.query as {
      consultationId?: string;
      token?: string;
    };

    let consultationId = cidFromQuery;

    // Si viene token, lo validamos y extraemos el consultationId
    let accessMode: 'public-token' | 'doctor-session' | null = null;
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

    // Si no hubo token, exigimos sesión de médico y consultationId en query
    let doctorId: string | undefined;
    if (!accessMode) {
      const session = await getServerAuthSession({ req, res });
      doctorId = (session as any)?.user?.doctorId as string | undefined;
      if (!doctorId) return res.status(401).end('Unauthorized');
      accessMode = 'doctor-session';
    }

    if (!consultationId) return res.status(400).end('Missing consultationId');

    // Filtro: si es sesión de médico, limitamos por doctorId; si es token, solo por id
    const c = await prisma.consultation.findFirst({
      where:
        accessMode === 'doctor-session'
          ? { id: consultationId, doctorId }
          : { id: consultationId },
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
