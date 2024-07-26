/*
  Warnings:

  - Made the column `status` on table `JobApplication` required. This step will fail if there are existing NULL values in that column.
  - Made the column `resumeKey` on table `JobApplication` required. This step will fail if there are existing NULL values in that column.
  - Made the column `postulantId` on table `JobApplication` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "JobApplication" DROP CONSTRAINT "JobApplication_postulantId_fkey";

-- AlterTable
ALTER TABLE "JobApplication" ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'pending',
ALTER COLUMN "resumeKey" SET NOT NULL,
ALTER COLUMN "resumeKey" SET DEFAULT 'expediente',
ALTER COLUMN "review" SET DEFAULT false,
ALTER COLUMN "interviewAt" DROP NOT NULL,
ALTER COLUMN "postulantId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_postulantId_fkey" FOREIGN KEY ("postulantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
