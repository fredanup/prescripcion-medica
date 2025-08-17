/*
  Warnings:

  - A unique constraint covering the columns `[consultationId,code,label]` on the table `ConsultationDiagnosis` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[consultationId,area,description]` on the table `MedicalOrder` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[consultationId,medication,dosage,frequency,duration,route]` on the table `MedicationPrescription` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `name` on the `Role` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('ADMIN', 'DOCTOR', 'PATIENT', 'PHARMACIST', 'STAFF');

-- DropForeignKey
ALTER TABLE "MedicationPrescription" DROP CONSTRAINT "MedicationPrescription_consultationId_fkey";

-- AlterTable
ALTER TABLE "Role" DROP COLUMN "name",
ADD COLUMN     "name" "RoleType" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationDiagnosis_consultationId_code_label_key" ON "ConsultationDiagnosis"("consultationId", "code", "label");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalOrder_consultationId_area_description_key" ON "MedicalOrder"("consultationId", "area", "description");

-- CreateIndex
CREATE UNIQUE INDEX "MedicationPrescription_consultationId_medication_dosage_fre_key" ON "MedicationPrescription"("consultationId", "medication", "dosage", "frequency", "duration", "route");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- AddForeignKey
ALTER TABLE "MedicationPrescription" ADD CONSTRAINT "MedicationPrescription_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
