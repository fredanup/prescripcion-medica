-- DropForeignKey
ALTER TABLE "ConsultationDiagnosis" DROP CONSTRAINT "ConsultationDiagnosis_consultationId_fkey";

-- AlterTable
ALTER TABLE "ConsultationDiagnosis" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "ConsultationDiagnosis" ADD CONSTRAINT "ConsultationDiagnosis_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
