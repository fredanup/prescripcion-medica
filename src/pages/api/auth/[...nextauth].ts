import { PrismaAdapter } from '@next-auth/prisma-adapter';
import NextAuth from 'next-auth';
import type { AppProviders } from 'next-auth/providers';
import CredentialsProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from 'server/prisma';

let useMockProvider = process.env.NODE_ENV === 'test';
const { GITHUB_CLIENT_ID, GITHUB_SECRET, NODE_ENV, APP_ENV, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET} = process.env;
if (
  (NODE_ENV !== 'production' || APP_ENV === 'test') &&
  (!GITHUB_CLIENT_ID || !GITHUB_SECRET || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET)
) {
  console.log('⚠️ Using mocked GitHub auth correct credentials were not added');
  useMockProvider = true;
}
const providers: AppProviders = [];
if (useMockProvider) {
  providers.push(
    CredentialsProvider({
      id: 'github',
      name: 'Mocked GitHub',
      async authorize(credentials) {
        if (credentials) {
          const name = credentials.name;
          return {
            id: name,
            name: name,
            email: name,
            role: name,
          };
        }
        return null;
      },
      credentials: {
        name: { type: 'test' },
      },
    }),
  );
} else {
  if (!GITHUB_CLIENT_ID || !GITHUB_SECRET || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Providers CLIENT_ID and SECRET must be set');
  }
  providers.push(
    GithubProvider({
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_SECRET,
      profile(profile) {
        return {
          id: profile.id,
          name: profile.login,
          email: profile.email,
          image: profile.avatar_url,
        } as any;
      },
    }),
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
   
    }),
  );
}
export default NextAuth({
  // Configure one or more authentication providers
  providers,
  adapter: PrismaAdapter(prisma),
  callbacks: {
  async session({ session, user }) {
    const userWithRoles = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        UserRole: { include: { role: true } },
        Doctor: true,
        Patient: true,
        Pharmacist: true,       // si tienes estas entidades clínicas
        LaboratoryStaff: true,  // igual aquí
      },
    });

    const roles = userWithRoles?.UserRole.map((ur) => ur.role.name) ?? [];

    return {
      ...session,
      user: session.user
        ? {
            ...session.user,
            id: user.id,
            roles,
            activeRole: roles[0], // puede cambiar luego desde frontend
            doctorId: userWithRoles?.Doctor?.id ?? null,
            patientId: userWithRoles?.Patient?.id ?? null,
            pharmacistId: userWithRoles?.Pharmacist?.id ?? null,
            labStaffId: userWithRoles?.LaboratoryStaff?.id ?? null,
          }
        : session.user,
    };
  },
},
  events: {
    async createUser({ user }) {
      // Verifica que no exista ya el Patient por si acaso
      const exists = await prisma.patient.findUnique({
        where: { userId: user.id },
      });

      if (!exists) {
        await prisma.patient.create({
          data: {
            userId: user.id,
            
          },
        });
      }

      // Asignar el rol "patient" automáticamente
      const patientRole = await prisma.role.findUnique({
        where: { name: 'patient' },
      });

      if (patientRole) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: patientRole.id,
          },
        });
      }
    },
  },
});
