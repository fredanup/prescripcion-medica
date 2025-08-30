// types/next-auth.d.ts
import { type DefaultSession, type DefaultJWT } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      roles: string[];
      activeRole: string | null;
      doctorId: string | null;
      patientId: string | null;
      pharmacistId: string | null;
      labStaffId: string | null;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    roles?: string[];
    activeRole?: string | null;
    doctorId?: string | null;
    patientId?: string | null;
    pharmacistId?: string | null;
    labStaffId?: string | null;
  }
}