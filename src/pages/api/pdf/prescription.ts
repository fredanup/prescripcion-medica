// src/pages/api/pdf/prescription.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'server/prisma';
import { getServerAuthSession } from 'server/auth';
import { buildPrescriptionPdfBuffer } from 'server/pdfs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerAuthSession({ req, res });
  const doctorId = (session as any)?.user?.doctorId as string | undefined;

  if (!doctorId) return res.status(401).end('Unauthorized');

  const cid = req.query.consultationId as string;
  if (!cid) return res.status(400).end('Missing consultationId');

  const c = await prisma.consultation.findFirst({
    where: { id: cid, doctorId },
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
  res.setHeader('Content-Disposition', `inline; filename=prescripcion-${cid}.pdf`);
  res.status(200).send(pdf);
}
