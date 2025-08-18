// pages/api/auth/[...nextauth].ts
import NextAuth, { type NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from 'server/prisma';

let useMockProvider = process.env.NODE_ENV === 'test';

const { GITHUB_CLIENT_ID, GITHUB_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

if (
  (process.env.NODE_ENV !== 'production' || process.env.APP_ENV === 'test') &&
  (!GITHUB_CLIENT_ID || !GITHUB_SECRET || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET)
) {
  console.log('⚠️ Using mocked GitHub auth because credentials are not set');
  useMockProvider = true;
}

const providers: any[] = [];

if (useMockProvider) {
  providers.push(
    CredentialsProvider({
      id: 'mock',
      name: 'Mocked Auth',
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
        name: { type: 'text' },
      },
    }),
  );
} else {
  providers.push(
    GithubProvider({
      clientId: GITHUB_CLIENT_ID!,
      clientSecret: GITHUB_SECRET!,
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
      clientId: GOOGLE_CLIENT_ID!,
      clientSecret: GOOGLE_CLIENT_SECRET!,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  callbacks: {
    async session({ session, user }) {
      const userWithRoles = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          UserRole: { include: { role: true } },
          Doctor: true,
          Patient: true,
          Pharmacist: true,
          LaboratoryStaff: true,
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
              activeRole: roles[0] ?? null,
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
      const exists = await prisma.patient.findUnique({
        where: { userId: user.id },
      });

      if (!exists) {
        await prisma.patient.create({
          data: { userId: user.id },
        });
      }

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
};

export default NextAuth(authOptions);
