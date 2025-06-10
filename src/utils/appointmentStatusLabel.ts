import type { AppointmentStatus } from '@prisma/client';
export const appointmentStatusLabel: Record<AppointmentStatus, string> = {
  pending_payment: 'Pendiente de pago',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
};
