// server/session-hydration.ts
import type { Session } from "next-auth";
import { prisma } from "./prisma";

export async function buildUserSessionFields(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      UserRole: { include: { role: true } },
      Doctor: true,
      Patient: true,
      Pharmacist: true,
      LaboratoryStaff: true,
    },
  });
  if (!user) return null;

  const roles = user.UserRole.map((ur) => ur.role.name);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: (user as any).image ?? null,
    roles,
    role: roles[0] ?? null, // Add 'role' property for compatibility
    activeRole: roles[0] ?? null,
    doctorId: user.Doctor?.id ?? null,
    patientId: user.Patient?.id ?? null,
    pharmacistId: user.Pharmacist?.id ?? null,
    labStaffId: user.LaboratoryStaff?.id ?? null,
  } as const;
}

// Útil para WS (construir un Session “real”)
export async function buildSessionForWs(userId: string, expires: Date): Promise<Session> {
  const fields = await buildUserSessionFields(userId);
  return {
    user: fields ?? undefined,              // tus augmentations viven aquí
    expires: expires.toISOString(),        // requerido por el tipo Session
  };
}
