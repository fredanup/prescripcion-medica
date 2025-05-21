import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { prisma } from '../prisma';
import { editUserBranchSchema } from '../../utils/auth';

import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const userRouter = createTRPCRouter({

findUnique: protectedProcedure.query(async ({ ctx }) => {
  const user = await ctx.prisma.user.findUnique({
    where: { id: ctx.session?.user?.id },
    select: {
      id: true,
      name: true,
      lastName: true,
      image: true,
      email: true,
      branchId: true,
      Branch: {
        select: {
          id: true,
          name: true,
        },
      },
      UserRole: {
        select: {
          role: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  // Opcional: transformar la estructura para que roles sea un array de strings
  const roles = user?.UserRole.map((ur) => ur.role.name) ?? [];

  return {
    ...user,
    roles,
  };
}),


  //Listar a los usuarios con su sucursal adjunta
  findManyUserBranch: protectedProcedure.query(async ({ctx}) => {
    const users = await ctx.prisma.user.findMany({
      select:{
        id:true,
        name:true,
        lastName:true,
        image:true,
        email:true,
        UserRole: {
          select: {
            role: {
              select: {
                name: true
              }
            }
          }
        },
        branchId:true,
        Branch:true
      },
      orderBy:{
        createdAt:'asc'
      }
    });
    return users;
  }),
  //Listar a los usuarios con su sucursal adjunta
  findPatients: protectedProcedure.query(async ({ctx}) => {
    const users = await ctx.prisma.user.findMany({
      where: {
        UserRole: {
          some: {
            role: {
              name: 'patient',
            },
          },
        },
      },
      select:{
        id:true,
        name:true,
        lastName:true,
        image:true,
        email:true,
    
        branchId:true,
        Branch:true
      },
      orderBy:{
        createdAt:'asc'
      }
    });
    return users;
  }),

findOne: publicProcedure.input(z.string()).query(async ({ input }) => {
  const user = await prisma.user.findUnique({
    where: { id: input },
    include: {
      UserRole: {
        include: {
          role: true,
        },
      },
    },
  });
  return user;
}),

  findCurrentOne: protectedProcedure.query(async ({ ctx }) => {
    //console.log('Session in findCurrentOne:', ctx.session);
    if (!ctx.session?.user?.id) {
      throw new Error('Not authenticated');
    }
    const user = await ctx.prisma.user.findUnique({ where: { id: ctx.session.user.id } });
    //console.log('User in findCurrentOne:', user);
    return user;
  }),
updateUser: protectedProcedure
  .input(editUserBranchSchema)
  .mutation(async ({ ctx, input }) => {
    const { id, name, lastName, roles, branchId } = input;

    try {

      if (
      ctx.session?.user?.id === id &&
      roles &&
      !roles.includes('admin')
    ) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'No puedes eliminar tu propio rol de administrador.',
      });
    }
    // Asegurar que al menos un admin permanezca
    const adminCount = await ctx.prisma.userRole.count({
      where: {
        role: { name: 'admin' },
        NOT: { userId: id },
      },
    });

    if (adminCount === 0 && !roles.includes('admin')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Debe existir al menos un administrador activo.',
      });
    }

      // 1. Actualizar datos del usuario
      await ctx.prisma.user.update({
        where: { id },
        data: {
          name,
          lastName,
          branchId,
        },
      });

      // 2. Eliminar los roles actuales del usuario
      await ctx.prisma.userRole.deleteMany({
        where: {
          userId: id,
        },
      });

      // 3. Insertar los nuevos roles asignados
      if (roles && roles.length > 0) {
        // Buscar los IDs reales de los roles por nombre
        const foundRoles = await ctx.prisma.role.findMany({
          where: {
            name: {
              in: roles,
            },
          },
        });

        // Crear relaciones
        await ctx.prisma.userRole.createMany({
          data: foundRoles.map((role) => ({
            userId: id,
            roleId: role.id,
          })),
        });

        // 4. Crear entidades clínicas si no existen
        for (const roleName of roles) {
          if (roleName === 'doctor') {
            const existingDoctor = await ctx.prisma.doctor.findUnique({
              where: { userId: id },
            });
            if (!existingDoctor) {
              await ctx.prisma.doctor.create({
                data: {
                  userId: id,
                  
                },
              });
            }
          }

          if (roleName === 'patient') {
            const existingPatient = await ctx.prisma.patient.findUnique({
              where: { userId: id },
            });
            if (!existingPatient) {
              await ctx.prisma.patient.create({
                data: {
                  userId: id,
                                    

                },
              });
            }
          }

          if (roleName === 'pharmacist') {
            const existingPharmacist = await ctx.prisma.pharmacist.findUnique({
              where: { userId: id },
            });
            if (!existingPharmacist) {
              await ctx.prisma.pharmacist.create({
                data: {
                  userId: id,
                },
              });
            }
          }

          if (roleName === 'laboratory_staff') {
            const existingLabStaff = await ctx.prisma.laboratoryStaff.findUnique({
              where: { userId: id },
            });
            if (!existingLabStaff) {
              await ctx.prisma.laboratoryStaff.create({
                data: {
                  userId: id,
                },
              });
            }
          }
        }
      }

    } catch (error) {
      console.error('[updateUser error]', error);
      throw new Error('Error al actualizar el usuario.');
    }
  }),

  deleteOne:  protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    try {
      await ctx.prisma.user.delete({
        where: { id: input.id },
      });
      
    } catch (error) {
      console.log(error);
    }
  }),
});