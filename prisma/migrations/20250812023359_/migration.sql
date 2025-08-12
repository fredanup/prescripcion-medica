/*
  Warnings:

  - You are about to drop the column `destination` on the `MedicalOrder` table. All the data in the column will be lost.
  - The `status` column on the `MedicalOrder` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "MedicalOrderStatus" AS ENUM ('pending', 'received', 'in_process', 'reported', 'cancelled');

-- CreateEnum
CREATE TYPE "MedicalOrderPriority" AS ENUM ('normal', 'urgent');

-- AlterTable
ALTER TABLE "Consultation" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "status" "ConsultationStatus" NOT NULL DEFAULT 'in_progress';

-- AlterTable
ALTER TABLE "MedicalOrder" DROP COLUMN "destination",
ADD COLUMN     "priority" "MedicalOrderPriority" NOT NULL DEFAULT 'normal',
DROP COLUMN "status",
ADD COLUMN     "status" "MedicalOrderStatus" NOT NULL DEFAULT 'pending';
