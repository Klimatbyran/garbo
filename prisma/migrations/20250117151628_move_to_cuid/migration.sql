/*
  Warnings:

  - The primary key for the `BaseYear` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `BiogenicEmissions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Economy` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Emissions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Employees` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Goal` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Industry` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Initiative` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Metadata` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ReportingPeriod` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Scope1` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Scope1And2` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Scope2` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Scope3` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Scope3Category` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `StatedTotalEmissions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Turnover` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "BiogenicEmissions" DROP CONSTRAINT "BiogenicEmissions_emissionsId_fkey";

-- DropForeignKey
ALTER TABLE "Economy" DROP CONSTRAINT "Economy_reportingPeriodId_fkey";

-- DropForeignKey
ALTER TABLE "Emissions" DROP CONSTRAINT "Emissions_reportingPeriodId_fkey";

-- DropForeignKey
ALTER TABLE "Employees" DROP CONSTRAINT "Employees_economyId_fkey";

-- DropForeignKey
ALTER TABLE "Metadata" DROP CONSTRAINT "Metadata_baseYearId_fkey";

-- DropForeignKey
ALTER TABLE "Metadata" DROP CONSTRAINT "Metadata_biogenicEmissionsId_fkey";

-- DropForeignKey
ALTER TABLE "Metadata" DROP CONSTRAINT "Metadata_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Metadata" DROP CONSTRAINT "Metadata_employeesId_fkey";

-- DropForeignKey
ALTER TABLE "Metadata" DROP CONSTRAINT "Metadata_goalId_fkey";

-- DropForeignKey
ALTER TABLE "Metadata" DROP CONSTRAINT "Metadata_industryId_fkey";

-- DropForeignKey
ALTER TABLE "Metadata" DROP CONSTRAINT "Metadata_initiativeId_fkey";

-- DropForeignKey
ALTER TABLE "Metadata" DROP CONSTRAINT "Metadata_reportingPeriodId_fkey";

-- DropForeignKey
ALTER TABLE "Metadata" DROP CONSTRAINT "Metadata_scope1And2Id_fkey";

-- DropForeignKey
ALTER TABLE "Metadata" DROP CONSTRAINT "Metadata_scope1Id_fkey";

-- DropForeignKey
ALTER TABLE "Metadata" DROP CONSTRAINT "Metadata_scope2Id_fkey";

-- DropForeignKey
ALTER TABLE "Metadata" DROP CONSTRAINT "Metadata_scope3Id_fkey";

-- DropForeignKey
ALTER TABLE "Metadata" DROP CONSTRAINT "Metadata_statedTotalEmissionsId_fkey";

-- DropForeignKey
ALTER TABLE "Metadata" DROP CONSTRAINT "Metadata_turnoverId_fkey";

-- DropForeignKey
ALTER TABLE "Metadata" DROP CONSTRAINT "Metadata_userId_fkey";

-- DropForeignKey
ALTER TABLE "Metadata" DROP CONSTRAINT "Metadata_verifiedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "Scope1" DROP CONSTRAINT "Scope1_emissionsId_fkey";

-- DropForeignKey
ALTER TABLE "Scope1And2" DROP CONSTRAINT "Scope1And2_emissionsId_fkey";

-- DropForeignKey
ALTER TABLE "Scope2" DROP CONSTRAINT "Scope2_emissionsId_fkey";

-- DropForeignKey
ALTER TABLE "Scope3" DROP CONSTRAINT "Scope3_emissionsId_fkey";

-- DropForeignKey
ALTER TABLE "Scope3Category" DROP CONSTRAINT "Scope3Category_scope3Id_fkey";

-- DropForeignKey
ALTER TABLE "StatedTotalEmissions" DROP CONSTRAINT "StatedTotalEmissions_emissionsId_fkey";

-- DropForeignKey
ALTER TABLE "StatedTotalEmissions" DROP CONSTRAINT "StatedTotalEmissions_scope3Id_fkey";

-- DropForeignKey
ALTER TABLE "Turnover" DROP CONSTRAINT "Turnover_economyId_fkey";

-- AlterTable
ALTER TABLE "BaseYear" DROP CONSTRAINT "BaseYear_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "BaseYear_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "BaseYear_id_seq";

-- AlterTable
ALTER TABLE "BiogenicEmissions" DROP CONSTRAINT "BiogenicEmissions_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "emissionsId" SET DATA TYPE TEXT,
ADD CONSTRAINT "BiogenicEmissions_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "BiogenicEmissions_id_seq";

-- AlterTable
ALTER TABLE "Economy" DROP CONSTRAINT "Economy_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "reportingPeriodId" SET DATA TYPE TEXT,
ALTER COLUMN "turnoverId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Economy_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Economy_id_seq";

-- AlterTable
ALTER TABLE "Emissions" DROP CONSTRAINT "Emissions_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "reportingPeriodId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Emissions_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Emissions_id_seq";

-- AlterTable
ALTER TABLE "Employees" DROP CONSTRAINT "Employees_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "economyId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Employees_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Employees_id_seq";

-- AlterTable
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Goal_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Goal_id_seq";

-- AlterTable
ALTER TABLE "Industry" DROP CONSTRAINT "Industry_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Industry_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Industry_id_seq";

-- AlterTable
ALTER TABLE "Initiative" DROP CONSTRAINT "Initiative_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Initiative_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Initiative_id_seq";

-- AlterTable
ALTER TABLE "Metadata" DROP CONSTRAINT "Metadata_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "verifiedByUserId" SET DATA TYPE TEXT,
ALTER COLUMN "goalId" SET DATA TYPE TEXT,
ALTER COLUMN "initiativeId" SET DATA TYPE TEXT,
ALTER COLUMN "scope1Id" SET DATA TYPE TEXT,
ALTER COLUMN "scope2Id" SET DATA TYPE TEXT,
ALTER COLUMN "scope3Id" SET DATA TYPE TEXT,
ALTER COLUMN "scope1And2Id" SET DATA TYPE TEXT,
ALTER COLUMN "reportingPeriodId" SET DATA TYPE TEXT,
ALTER COLUMN "baseYearId" SET DATA TYPE TEXT,
ALTER COLUMN "biogenicEmissionsId" SET DATA TYPE TEXT,
ALTER COLUMN "statedTotalEmissionsId" SET DATA TYPE TEXT,
ALTER COLUMN "industryId" SET DATA TYPE TEXT,
ALTER COLUMN "categoryId" SET DATA TYPE TEXT,
ALTER COLUMN "turnoverId" SET DATA TYPE TEXT,
ALTER COLUMN "employeesId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Metadata_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Metadata_id_seq";

-- AlterTable
ALTER TABLE "ReportingPeriod" DROP CONSTRAINT "ReportingPeriod_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "ReportingPeriod_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "ReportingPeriod_id_seq";

-- AlterTable
ALTER TABLE "Scope1" DROP CONSTRAINT "Scope1_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "emissionsId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Scope1_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Scope1_id_seq";

-- AlterTable
ALTER TABLE "Scope1And2" DROP CONSTRAINT "Scope1And2_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "emissionsId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Scope1And2_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Scope1And2_id_seq";

-- AlterTable
ALTER TABLE "Scope2" DROP CONSTRAINT "Scope2_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "emissionsId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Scope2_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Scope2_id_seq";

-- AlterTable
ALTER TABLE "Scope3" DROP CONSTRAINT "Scope3_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "emissionsId" SET DATA TYPE TEXT,
ALTER COLUMN "statedTotalEmissionsId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Scope3_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Scope3_id_seq";

-- AlterTable
ALTER TABLE "Scope3Category" DROP CONSTRAINT "Scope3Category_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "scope3Id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Scope3Category_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Scope3Category_id_seq";

-- AlterTable
ALTER TABLE "StatedTotalEmissions" DROP CONSTRAINT "StatedTotalEmissions_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "scope3Id" SET DATA TYPE TEXT,
ALTER COLUMN "emissionsId" SET DATA TYPE TEXT,
ADD CONSTRAINT "StatedTotalEmissions_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "StatedTotalEmissions_id_seq";

-- AlterTable
ALTER TABLE "Turnover" DROP CONSTRAINT "Turnover_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "economyId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Turnover_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Turnover_id_seq";

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- AddForeignKey
ALTER TABLE "Emissions" ADD CONSTRAINT "Emissions_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatedTotalEmissions" ADD CONSTRAINT "StatedTotalEmissions_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatedTotalEmissions" ADD CONSTRAINT "StatedTotalEmissions_scope3Id_fkey" FOREIGN KEY ("scope3Id") REFERENCES "Scope3"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scope1And2" ADD CONSTRAINT "Scope1And2_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiogenicEmissions" ADD CONSTRAINT "BiogenicEmissions_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scope1" ADD CONSTRAINT "Scope1_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scope2" ADD CONSTRAINT "Scope2_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scope3" ADD CONSTRAINT "Scope3_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scope3Category" ADD CONSTRAINT "Scope3Category_scope3Id_fkey" FOREIGN KEY ("scope3Id") REFERENCES "Scope3"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Economy" ADD CONSTRAINT "Economy_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turnover" ADD CONSTRAINT "Turnover_economyId_fkey" FOREIGN KEY ("economyId") REFERENCES "Economy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employees" ADD CONSTRAINT "Employees_economyId_fkey" FOREIGN KEY ("economyId") REFERENCES "Economy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_scope1Id_fkey" FOREIGN KEY ("scope1Id") REFERENCES "Scope1"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_scope2Id_fkey" FOREIGN KEY ("scope2Id") REFERENCES "Scope2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_scope3Id_fkey" FOREIGN KEY ("scope3Id") REFERENCES "Scope3"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_scope1And2Id_fkey" FOREIGN KEY ("scope1And2Id") REFERENCES "Scope1And2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_baseYearId_fkey" FOREIGN KEY ("baseYearId") REFERENCES "BaseYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_biogenicEmissionsId_fkey" FOREIGN KEY ("biogenicEmissionsId") REFERENCES "BiogenicEmissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_statedTotalEmissionsId_fkey" FOREIGN KEY ("statedTotalEmissionsId") REFERENCES "StatedTotalEmissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Scope3Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_turnoverId_fkey" FOREIGN KEY ("turnoverId") REFERENCES "Turnover"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_employeesId_fkey" FOREIGN KEY ("employeesId") REFERENCES "Employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
