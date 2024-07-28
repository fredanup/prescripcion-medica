import * as z from 'zod';

//Consulta utilizada para mostrar a los usuarios con sus sucursales
export const userBranchSchema = z.object({
    id:z.string(),
    name: z.string().nullable(),
    lastName: z.string().nullable(), 
    image: z.string().nullable(),
    email:z.string(),
    role: z.string().nullable(), 
    branchId:z.string().nullable(), 
    Branch: z.object({
      address:z.string().nullable()
    }).nullable()
  });

  export const editUserBranchSchema = z.object({
    id:z.string(),
    name: z.string().nullable(),
    lastName: z.string().nullable(),     
    role: z.string().nullable(), 
    branchId:z.string().nullable()
  });

  export const branchSchema = z.object({
    id:z.string(),
    name: z.string(),
    address: z.string().nullable(),     
  });

  export const documentSchema = z.object({
    document: z.string(),
    key: z.string(),
  });

  export const createCallingSchema = z.object({
    requirement:z.string(),
    min_exp_work:z.number(),        
    resultAt:z.date(),
    expiresAt:z.date()
  });

  export const editCallingSchema = createCallingSchema.extend({
    id:z.string(),  
  });

  
  export const createApplicationSchema = z.object({
    postulantId: z.string(),
    callingId: z.string(),
  });

  export const editApplicationSchema = createApplicationSchema.extend({
    id:z.string(),  
  });

  export const jobApplicationSchema = z.object({
    Postulant: z.object({
      name: z.string().nullable(),
      lastName: z.string().nullable(),
      image: z.string().nullable(),
      email: z.string(),
    }),
    resumeKey: z.string(),
  });



  export type IUserBranch = z.infer<typeof userBranchSchema>;
  export type IEditUserBranch = z.infer<typeof editUserBranchSchema>;
  export type IBranch = z.infer<typeof branchSchema>;
  export type ICreateCalling = z.infer<typeof createCallingSchema>;
  export type IEditCalling = z.infer<typeof editCallingSchema>;
  export type IEditApplication = z.infer<typeof editApplicationSchema>;
  export type IJobApplication=z.infer<typeof jobApplicationSchema>;