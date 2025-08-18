// src/pages/api/pharmacy/prescription.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import {prisma} from 'server/prisma';
import jwt from 'jsonwebtoken';

const SIGN_SECRET = process.env.SIGN_SECRET ?? 'dev-secret-change-me';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.query.token as string;
  if (!token) return res.status(400).end('Missing token');
  try {
    const payload = jwt.verify(token, SIGN_SECRET) as any;
    const c = await prisma.consultation.findUnique({
      where: { id: payload.cid },
      include: {
        patient: { include: { user: true } },
        prescriptions: true,
      },
    });
    if (!c) return res.status(404).end('Not found');

    // Respuesta mínima en JSON (puedes renderizar HTML si prefieres)
    res.status(200).json({
      consultationId: c.id,
      date: c.date,
      patient: {
        name: c.patient?.user?.name,
        lastName: c.patient?.user?.lastName,
        document: c.patient?.user?.documentNumber,
      },
      prescriptions: c.prescriptions.map((rx) => ({
        id: rx.id,
        medication: rx.medication,
        dosage: rx.dosage,
        frequency: rx.frequency,
        duration: rx.duration,
        route: rx.route,
        dispensed: rx.dispensed,
        dispensedAt: rx.dispensedAt,
      })),
    });
  } catch {
    res.status(401).end('Invalid token');
  }
}
