/*
  Warnings:

  - Added the required column `callingId` to the `JobApplication` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "JobApplication" ADD COLUMN     "callingId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_callingId_fkey" FOREIGN KEY ("callingId") REFERENCES "Calling"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
