-- AlterTable: Change Metadata FKs from ON DELETE SET NULL to ON DELETE CASCADE
-- so that when a company (and its goals, initiatives, reporting periods, etc.) is deleted,
-- the related Metadata rows are deleted instead of left as orphans with null FKs.

ALTER TABLE "Metadata" DROP CONSTRAINT IF EXISTS "Metadata_goalId_fkey";
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Metadata" DROP CONSTRAINT IF EXISTS "Metadata_initiativeId_fkey";
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Metadata" DROP CONSTRAINT IF EXISTS "Metadata_scope1Id_fkey";
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_scope1Id_fkey" FOREIGN KEY ("scope1Id") REFERENCES "Scope1"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Metadata" DROP CONSTRAINT IF EXISTS "Metadata_scope2Id_fkey";
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_scope2Id_fkey" FOREIGN KEY ("scope2Id") REFERENCES "Scope2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Metadata" DROP CONSTRAINT IF EXISTS "Metadata_scope3Id_fkey";
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_scope3Id_fkey" FOREIGN KEY ("scope3Id") REFERENCES "Scope3"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Metadata" DROP CONSTRAINT IF EXISTS "Metadata_scope1And2Id_fkey";
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_scope1And2Id_fkey" FOREIGN KEY ("scope1And2Id") REFERENCES "Scope1And2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Metadata" DROP CONSTRAINT IF EXISTS "Metadata_reportingPeriodId_fkey";
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Metadata" DROP CONSTRAINT IF EXISTS "Metadata_baseYearId_fkey";
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_baseYearId_fkey" FOREIGN KEY ("baseYearId") REFERENCES "BaseYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Metadata" DROP CONSTRAINT IF EXISTS "Metadata_biogenicEmissionsId_fkey";
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_biogenicEmissionsId_fkey" FOREIGN KEY ("biogenicEmissionsId") REFERENCES "BiogenicEmissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Metadata" DROP CONSTRAINT IF EXISTS "Metadata_statedTotalEmissionsId_fkey";
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_statedTotalEmissionsId_fkey" FOREIGN KEY ("statedTotalEmissionsId") REFERENCES "StatedTotalEmissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Metadata" DROP CONSTRAINT IF EXISTS "Metadata_industryId_fkey";
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Metadata" DROP CONSTRAINT IF EXISTS "Metadata_categoryId_fkey";
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Scope3Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Metadata" DROP CONSTRAINT IF EXISTS "Metadata_turnoverId_fkey";
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_turnoverId_fkey" FOREIGN KEY ("turnoverId") REFERENCES "Turnover"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Metadata" DROP CONSTRAINT IF EXISTS "Metadata_employeesId_fkey";
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_employeesId_fkey" FOREIGN KEY ("employeesId") REFERENCES "Employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
