/*
  Warnings:

  - You are about to drop the column `name` on the `MedicationPrescription` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `MedicationPrescription` table. All the data in the column will be lost.
  - You are about to drop the `Medication` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `plan` to the `Consultation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destination` to the `MedicalOrder` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `area` on the `MedicalOrder` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `medication` to the `MedicationPrescription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `route` to the `MedicationPrescription` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MedicalOrderType" AS ENUM ('laboratory', 'imaging');

-- DropForeignKey
ALTER TABLE "Medication" DROP CONSTRAINT "Medication_patientId_fkey";

-- AlterTable
ALTER TABLE "Consultation" ADD COLUMN     "plan" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MedicalOrder" ADD COLUMN     "destination" TEXT NOT NULL,
DROP COLUMN "area",
ADD COLUMN     "area" "MedicalOrderType" NOT NULL;

-- AlterTable
ALTER TABLE "MedicationPrescription" DROP COLUMN "name",
DROP COLUMN "notes",
ADD COLUMN     "medication" TEXT NOT NULL,
ADD COLUMN     "route" TEXT NOT NULL;

-- DropTable
DROP TABLE "Medication";
