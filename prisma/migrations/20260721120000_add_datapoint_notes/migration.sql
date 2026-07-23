-- CreateEnum
CREATE TYPE "DatapointErrorStatus" AS ENUM ('OPEN', 'RESOLVED', 'WONT_FIX');

-- CreateTable
CREATE TABLE "error_types" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "error_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "datapoint_notes" (
    "id" TEXT NOT NULL,
    "comment" TEXT,
    "errorTypeId" TEXT,
    "errorReason" TEXT,
    "status" "DatapointErrorStatus",
    "previousValue" DOUBLE PRECISION,
    "newValue" DOUBLE PRECISION,
    "reportRunId" TEXT,
    "scope1Id" TEXT,
    "scope2Id" TEXT,
    "scope3Id" TEXT,
    "categoryId" TEXT,
    "scope1And2Id" TEXT,
    "statedTotalEmissionsId" TEXT,
    "biogenicEmissionsId" TEXT,
    "turnoverId" TEXT,
    "employeesId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "datapoint_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "error_types_key_key" ON "error_types"("key");

-- CreateIndex
CREATE INDEX "datapoint_notes_scope1Id_idx" ON "datapoint_notes"("scope1Id");

-- CreateIndex
CREATE INDEX "datapoint_notes_scope2Id_idx" ON "datapoint_notes"("scope2Id");

-- CreateIndex
CREATE INDEX "datapoint_notes_scope3Id_idx" ON "datapoint_notes"("scope3Id");

-- CreateIndex
CREATE INDEX "datapoint_notes_categoryId_idx" ON "datapoint_notes"("categoryId");

-- CreateIndex
CREATE INDEX "datapoint_notes_scope1And2Id_idx" ON "datapoint_notes"("scope1And2Id");

-- CreateIndex
CREATE INDEX "datapoint_notes_statedTotalEmissionsId_idx" ON "datapoint_notes"("statedTotalEmissionsId");

-- CreateIndex
CREATE INDEX "datapoint_notes_biogenicEmissionsId_idx" ON "datapoint_notes"("biogenicEmissionsId");

-- CreateIndex
CREATE INDEX "datapoint_notes_turnoverId_idx" ON "datapoint_notes"("turnoverId");

-- CreateIndex
CREATE INDEX "datapoint_notes_employeesId_idx" ON "datapoint_notes"("employeesId");

-- CreateIndex
CREATE INDEX "datapoint_notes_reportRunId_idx" ON "datapoint_notes"("reportRunId");

-- CreateIndex
CREATE INDEX "datapoint_notes_errorTypeId_idx" ON "datapoint_notes"("errorTypeId");

-- AddForeignKey
ALTER TABLE "datapoint_notes" ADD CONSTRAINT "datapoint_notes_errorTypeId_fkey" FOREIGN KEY ("errorTypeId") REFERENCES "error_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "datapoint_notes" ADD CONSTRAINT "datapoint_notes_reportRunId_fkey" FOREIGN KEY ("reportRunId") REFERENCES "ReportRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "datapoint_notes" ADD CONSTRAINT "datapoint_notes_scope1Id_fkey" FOREIGN KEY ("scope1Id") REFERENCES "Scope1"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "datapoint_notes" ADD CONSTRAINT "datapoint_notes_scope2Id_fkey" FOREIGN KEY ("scope2Id") REFERENCES "Scope2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "datapoint_notes" ADD CONSTRAINT "datapoint_notes_scope3Id_fkey" FOREIGN KEY ("scope3Id") REFERENCES "Scope3"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "datapoint_notes" ADD CONSTRAINT "datapoint_notes_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Scope3Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "datapoint_notes" ADD CONSTRAINT "datapoint_notes_scope1And2Id_fkey" FOREIGN KEY ("scope1And2Id") REFERENCES "Scope1And2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "datapoint_notes" ADD CONSTRAINT "datapoint_notes_statedTotalEmissionsId_fkey" FOREIGN KEY ("statedTotalEmissionsId") REFERENCES "StatedTotalEmissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "datapoint_notes" ADD CONSTRAINT "datapoint_notes_biogenicEmissionsId_fkey" FOREIGN KEY ("biogenicEmissionsId") REFERENCES "BiogenicEmissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "datapoint_notes" ADD CONSTRAINT "datapoint_notes_turnoverId_fkey" FOREIGN KEY ("turnoverId") REFERENCES "Turnover"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "datapoint_notes" ADD CONSTRAINT "datapoint_notes_employeesId_fkey" FOREIGN KEY ("employeesId") REFERENCES "Employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "datapoint_notes" ADD CONSTRAINT "datapoint_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
