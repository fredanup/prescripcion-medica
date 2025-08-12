-- CreateTable
CREATE TABLE "ConsultationDiagnosis" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "code" TEXT,
    "label" TEXT NOT NULL,
    "severity" TEXT,
    "notes" TEXT,

    CONSTRAINT "ConsultationDiagnosis_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ConsultationDiagnosis" ADD CONSTRAINT "ConsultationDiagnosis_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
