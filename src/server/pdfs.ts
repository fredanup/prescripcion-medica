import PDFDocument from 'pdfkit';
import type { Prisma } from '@prisma/client';

export async function buildPrescriptionPdfBuffer(
  c: Prisma.ConsultationGetPayload<{
    include: {
      patient: { include: { user: true } },
      doctor: { include: { user: true } },
      indications: true,
      prescriptions: true,
      appointment: { include: { specialty: true } },
    }
  }>
) {
  const buffers: Uint8Array[] = [];
  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  doc.on('data', d => buffers.push(d));
  const done = new Promise<Buffer>(resolve => doc.on('end', () => resolve(Buffer.concat(buffers))));

  doc.fontSize(16).text('Indicaciones y Prescripción', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10)
    .text(`Consulta: ${c.id}`)
    .text(`Fecha: ${new Date(c.date).toLocaleString('es-PE')}`)
    .text(`Paciente: ${c.patient?.user?.name ?? ''} ${c.patient?.user?.lastName ?? ''}`)
    .text(`Médico: ${c.doctor?.user?.name ?? ''} ${c.doctor?.user?.lastName ?? ''}`)
    .text(`Especialidad: ${c.appointment?.specialty?.name ?? '-'}`);
  doc.moveDown();

  doc.fontSize(12).text('Indicaciones', { underline: true });
  doc.moveDown(0.2);
  if (!c.indications.length) doc.fontSize(10).text('—');
  else c.indications.forEach((i, idx) => doc.fontSize(10).text(`${idx + 1}. ${i.instruction}${i.notes ? ` — ${i.notes}` : ''}`));
  doc.moveDown();

  doc.fontSize(12).text('Prescripciones', { underline: true });
  doc.moveDown(0.2);
  if (!c.prescriptions.length) doc.fontSize(10).text('—');
  else c.prescriptions.forEach((rx, idx) => {
    const parts = [
      rx.medication,
      rx.dosage && `Dosis: ${rx.dosage}`,
      rx.frequency && `Frec.: ${rx.frequency}`,
      rx.duration && `Duración: ${rx.duration}`,
      rx.route && `Vía: ${rx.route}`,
    ].filter(Boolean);
    doc.fontSize(10).text(`${idx + 1}. ${parts.join(' · ')}`);
  });

  doc.end();
  return done;
}
