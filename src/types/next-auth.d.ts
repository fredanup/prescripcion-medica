import { type DefaultSession } from 'next-auth';

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user?: {
      id: string;
      role: string;
      activeRole: string;
      doctorId?: string | null;
      patientId?: string | null;
      pharmacistId?: string | null;
      labStaffId?: string | null;
    } & DefaultSession['user'];
  }

}