/*
  Warnings:

  - You are about to drop the column `text` on the `Allergy` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Allergy` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `ClinicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `ClinicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `Consultation` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Consultation` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Medication` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `Medication` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Medication` table. All the data in the column will be lost.
  - Added the required column `patientId` to the `Allergy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `substance` to the `Allergy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientId` to the `ClinicalHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `summary` to the `ClinicalHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `doctorId` to the `Consultation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientId` to the `Consultation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reason` to the `Consultation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Medication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientId` to the `Medication` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Allergy" DROP CONSTRAINT "Allergy_userId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicalHistory" DROP CONSTRAINT "ClinicalHistory_userId_fkey";

-- DropForeignKey
ALTER TABLE "Consultation" DROP CONSTRAINT "Consultation_userId_fkey";

-- DropForeignKey
ALTER TABLE "Medication" DROP CONSTRAINT "Medication_userId_fkey";

-- AlterTable
ALTER TABLE "Allergy" DROP COLUMN "text",
DROP COLUMN "userId",
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "patientId" TEXT NOT NULL,
ADD COLUMN     "severity" TEXT,
ADD COLUMN     "substance" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ClinicalHistory" DROP COLUMN "text",
DROP COLUMN "userId",
ADD COLUMN     "patientId" TEXT NOT NULL,
ADD COLUMN     "summary" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Consultation" DROP COLUMN "text",
DROP COLUMN "userId",
ADD COLUMN     "diagnosis" TEXT,
ADD COLUMN     "doctorId" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "patientId" TEXT NOT NULL,
ADD COLUMN     "reason" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Medication" DROP COLUMN "date",
DROP COLUMN "text",
DROP COLUMN "userId",
ADD COLUMN     "dosage" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "frequency" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "patientId" TEXT NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MedicalIndication" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "MedicalIndication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationPrescription" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "notes" TEXT,
    "dispensed" BOOLEAN NOT NULL DEFAULT false,
    "dispensedAt" TIMESTAMP(3),

    CONSTRAINT "MedicationPrescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalOrder" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "consultationId" TEXT,
    "area" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "results" TEXT,
    "resultFile" TEXT,
    "dispensedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicalOrder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ClinicalHistory" ADD CONSTRAINT "ClinicalHistory_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalIndication" ADD CONSTRAINT "MedicalIndication_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationPrescription" ADD CONSTRAINT "MedicationPrescription_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allergy" ADD CONSTRAINT "Allergy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalOrder" ADD CONSTRAINT "MedicalOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalOrder" ADD CONSTRAINT "MedicalOrder_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalOrder" ADD CONSTRAINT "MedicalOrder_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
