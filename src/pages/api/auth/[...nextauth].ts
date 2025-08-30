// pages/api/auth/[...nextauth].ts
import NextAuth, { type NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '../../../server/prisma';

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
  
  // Configuración de sesión
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },

  // Secret para JWT
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, user, account }) {
      // Solo cargar datos del usuario cuando es la primera vez (sign in)
      if (user && account) {
        try {
          const userWithRoles = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
              UserRole: { include: { role: true } },
              Doctor: { select: { id: true } },
              Patient: { select: { id: true } },
              Pharmacist: { select: { id: true } },
              LaboratoryStaff: { select: { id: true } },
            },
          });

          const roles = userWithRoles?.UserRole.map((ur) => ur.role.name) ?? [];
          
          // Almacenar en el token JWT
          token.sub = user.id;
          token.roles = roles;
          token.activeRole = roles[0] ?? null;
          token.doctorId = userWithRoles?.Doctor?.id ?? null;
          token.patientId = userWithRoles?.Patient?.id ?? null;
          token.pharmacistId = userWithRoles?.Pharmacist?.id ?? null;
          token.labStaffId = userWithRoles?.LaboratoryStaff?.id ?? null;
        } catch (error) {
          console.error('Error loading user roles in JWT callback:', error);
          // En caso de error, establecer valores por defecto
          token.sub = user.id;
          token.roles = [];
          token.activeRole = null;
          token.doctorId = null;
          token.patientId = null;
          token.pharmacistId = null;
          token.labStaffId = null;
        }
      }
      
      return token;
    },

    async session({ session, token }) {
      // Usar datos del token en lugar de hacer queries adicionales
      if (token && session.user) {
        return {
          ...session,
          user: {
            ...session.user,
            id: token.sub!, // token.sub siempre contiene el user ID
            roles: token.roles!,
            activeRole: (token.activeRole as string | null) ?? null,
            doctorId: (token.doctorId as string | null) ?? null,
            patientId: (token.patientId as string | null) ?? null,
            pharmacistId: (token.pharmacistId as string | null) ?? null,
            labStaffId: (token.labStaffId as string | null) ?? null,
          },
        };
      }

      return session;
    },
  },

  events: {
    async createUser({ user }) {
      try {
        // Usar transaction para atomicidad
        await prisma.$transaction(async (tx) => {
          // Verificar si ya existe un Patient para este usuario
          const existingPatient = await tx.patient.findUnique({
            where: { userId: user.id },
          });

          if (!existingPatient) {
            await tx.patient.create({
              data: { userId: user.id },
            });
          }

          // Obtener el rol de paciente (usando enum)
          const patientRole = await tx.role.findUnique({
            where: { name: 'patient' }, // Prisma manejará la conversión del enum
          });

          if (patientRole) {
            // Verificar si ya existe la relación UserRole
            const existingUserRole = await tx.userRole.findUnique({
              where: {
                userId_roleId: {
                  userId: user.id,
                  roleId: patientRole.id,
                },
              },
            });

            if (!existingUserRole) {
              await tx.userRole.create({
                data: {
                  userId: user.id,
                  roleId: patientRole.id,
                },
              });
            }
          }
        });

        console.log(`✅ User created and assigned patient role: ${user.id}`);
      } catch (error) {
        console.error('❌ Error in createUser event:', error);
        // No re-throw para no bloquear el sign-in
      }
    },

    async signIn({ user, account }) {
      console.log(`👤 User signing in: ${user.email} via ${account?.provider}`);
      // No return value needed for signIn event
    },

    async signOut({ token }) {
      console.log(`👋 User signing out: ${token.sub}`);
    },
  },

  pages: {
    // Opcional: páginas personalizadas
    // signIn: '/auth/signin',
    // error: '/auth/error',
  },

  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);