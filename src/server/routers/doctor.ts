import { createTRPCRouter, protectedProcedure } from "../../server/trpc";
import { z } from "zod";

export const doctorRouter = createTRPCRouter({

  findBySpecialty: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
        try {
        const doctors = await ctx.prisma.doctor.findMany({
            where: {
                Specialty: {
                    some:{
                        id: input.id
                    }
                }
            },
            include :{
                user: {
                    select: {
                        id: true,
                        name: true,
                        lastName: true,
                        image: true
                    }
                }
            }

        });
        return doctors;
        } catch (error) {
        console.log(error);
        }
    }),
});