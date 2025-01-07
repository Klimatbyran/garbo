/*
  Warnings:

  `metadataId` on the `BiogenicEmissions` --> get the BiogenicEmissions.id and BiogenicEmissions.metadataId
  Using the BiogenicEmissions.metadataId --> find the Metadata and set Metadata.biogenicEmissionsId to BiogenicEmissions.id

  - You are about to drop the column `metadataId` on the `BaseYear` table. All the data in the column will be lost.
  - You are about to drop the column `metadataId` on the `BiogenicEmissions` table. All the data in the column will be lost.
  - You are about to drop the column `employeesId` on the `Economy` table. All the data in the column will be lost.
  - You are about to drop the column `biogenicEmissionsId` on the `Emissions` table. All the data in the column will be lost.
  - You are about to drop the column `scope1And2Id` on the `Emissions` table. All the data in the column will be lost.
  - You are about to drop the column `scope1Id` on the `Emissions` table. All the data in the column will be lost.
  - You are about to drop the column `scope2Id` on the `Emissions` table. All the data in the column will be lost.
  - You are about to drop the column `scope3Id` on the `Emissions` table. All the data in the column will be lost.
  - You are about to drop the column `statedTotalEmissionsId` on the `Emissions` table. All the data in the column will be lost.
  - You are about to drop the column `metadataId` on the `Employees` table. All the data in the column will be lost.
  - You are about to drop the column `metadataId` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the column `metadataId` on the `Industry` table. All the data in the column will be lost.
  - You are about to drop the column `metadataId` on the `Initiative` table. All the data in the column will be lost.
  - The primary key for the `ReportingPeriod` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `economyId` on the `ReportingPeriod` table. All the data in the column will be lost.
  - You are about to drop the column `emissionsId` on the `ReportingPeriod` table. All the data in the column will be lost.
  - You are about to drop the column `metadataId` on the `ReportingPeriod` table. All the data in the column will be lost.
  - You are about to drop the column `metadataId` on the `Scope1` table. All the data in the column will be lost.
  - You are about to drop the column `metadataId` on the `Scope1And2` table. All the data in the column will be lost.
  - You are about to drop the column `metadataId` on the `Scope2` table. All the data in the column will be lost.
  - You are about to drop the column `metadataId` on the `Scope3` table. All the data in the column will be lost.
  - You are about to drop the column `metadataId` on the `Scope3Category` table. All the data in the column will be lost.
  - You are about to drop the column `metadataId` on the `StatedTotalEmissions` table. All the data in the column will be lost.
  - You are about to drop the column `metadataId` on the `Turnover` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[emissionsId]` on the table `BiogenicEmissions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reportingPeriodId]` on the table `Economy` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reportingPeriodId]` on the table `Emissions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[economyId]` on the table `Employees` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[goalId]` on the table `Metadata` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[initiativeId]` on the table `Metadata` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[scope1Id]` on the table `Metadata` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[scope2Id]` on the table `Metadata` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[scope3Id]` on the table `Metadata` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[scope1And2Id]` on the table `Metadata` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reportingPeriodId]` on the table `Metadata` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[baseYearId]` on the table `Metadata` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[biogenicEmissionsId]` on the table `Metadata` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[statedTotalEmissionsId]` on the table `Metadata` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[industryId]` on the table `Metadata` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[categoryId]` on the table `Metadata` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[turnoverId]` on the table `Metadata` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[employeesId]` on the table `Metadata` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,year]` on the table `ReportingPeriod` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[emissionsId]` on the table `Scope1` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[emissionsId]` on the table `Scope1And2` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[emissionsId]` on the table `Scope2` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[emissionsId]` on the table `Scope3` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[emissionsId]` on the table `StatedTotalEmissions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[economyId]` on the table `Turnover` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `economyId` to the `Turnover` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "BaseYear" DROP CONSTRAINT "BaseYear_companyId_fkey";

-- DropForeignKey
ALTER TABLE "BaseYear" DROP CONSTRAINT "BaseYear_metadataId_fkey";

-- DropForeignKey
ALTER TABLE "BiogenicEmissions" DROP CONSTRAINT "BiogenicEmissions_metadataId_fkey";

-- DropForeignKey
ALTER TABLE "Economy" DROP CONSTRAINT "Economy_employeesId_fkey";

-- DropForeignKey
ALTER TABLE "Economy" DROP CONSTRAINT "Economy_turnoverId_fkey";

-- DropForeignKey
ALTER TABLE "Emissions" DROP CONSTRAINT "Emissions_biogenicEmissionsId_fkey";

-- DropForeignKey
ALTER TABLE "Emissions" DROP CONSTRAINT "Emissions_scope1And2Id_fkey";

-- DropForeignKey
ALTER TABLE "Emissions" DROP CONSTRAINT "Emissions_scope1Id_fkey";

-- DropForeignKey
ALTER TABLE "Emissions" DROP CONSTRAINT "Emissions_scope2Id_fkey";

-- DropForeignKey
ALTER TABLE "Emissions" DROP CONSTRAINT "Emissions_scope3Id_fkey";

-- DropForeignKey
ALTER TABLE "Emissions" DROP CONSTRAINT "Emissions_statedTotalEmissionsId_fkey";

-- DropForeignKey
ALTER TABLE "Employees" DROP CONSTRAINT "Employees_metadataId_fkey";

-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_metadataId_fkey";

-- DropForeignKey
ALTER TABLE "Industry" DROP CONSTRAINT "Industry_companyWikidataId_fkey";

-- DropForeignKey
ALTER TABLE "Industry" DROP CONSTRAINT "Industry_metadataId_fkey";

-- DropForeignKey
ALTER TABLE "Initiative" DROP CONSTRAINT "Initiative_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Initiative" DROP CONSTRAINT "Initiative_metadataId_fkey";

-- DropForeignKey
ALTER TABLE "ReportingPeriod" DROP CONSTRAINT "ReportingPeriod_companyId_fkey";

-- DropForeignKey
ALTER TABLE "ReportingPeriod" DROP CONSTRAINT "ReportingPeriod_economyId_fkey";

-- DropForeignKey
ALTER TABLE "ReportingPeriod" DROP CONSTRAINT "ReportingPeriod_emissionsId_fkey";

-- DropForeignKey
ALTER TABLE "ReportingPeriod" DROP CONSTRAINT "ReportingPeriod_metadataId_fkey";

-- DropForeignKey
ALTER TABLE "Scope1" DROP CONSTRAINT "Scope1_metadataId_fkey";

-- DropForeignKey
ALTER TABLE "Scope1And2" DROP CONSTRAINT "Scope1And2_metadataId_fkey";

-- DropForeignKey
ALTER TABLE "Scope2" DROP CONSTRAINT "Scope2_metadataId_fkey";

-- DropForeignKey
ALTER TABLE "Scope3" DROP CONSTRAINT "Scope3_metadataId_fkey";

-- DropForeignKey
ALTER TABLE "Scope3Category" DROP CONSTRAINT "Scope3Category_metadataId_fkey";

-- DropForeignKey
ALTER TABLE "Scope3Category" DROP CONSTRAINT "Scope3Category_scope3Id_fkey";

-- DropForeignKey
ALTER TABLE "StatedTotalEmissions" DROP CONSTRAINT "StatedTotalEmissions_metadataId_fkey";

-- DropForeignKey
ALTER TABLE "StatedTotalEmissions" DROP CONSTRAINT "StatedTotalEmissions_scope3Id_fkey";

-- DropForeignKey
ALTER TABLE "Turnover" DROP CONSTRAINT "Turnover_metadataId_fkey";

-- DropIndex
DROP INDEX "Economy_employeesId_key";

-- DropIndex
DROP INDEX "Economy_turnoverId_key";

-- DropIndex
DROP INDEX "Emissions_biogenicEmissionsId_key";

-- DropIndex
DROP INDEX "Emissions_scope1And2Id_key";

-- DropIndex
DROP INDEX "Emissions_scope1Id_key";

-- DropIndex
DROP INDEX "Emissions_scope2Id_key";

-- DropIndex
DROP INDEX "Emissions_scope3Id_key";

-- DropIndex
DROP INDEX "Emissions_statedTotalEmissionsId_key";

-- DropIndex
DROP INDEX "ReportingPeriod_economyId_key";

-- DropIndex
DROP INDEX "ReportingPeriod_emissionsId_key";

-- AlterTable
ALTER TABLE "BaseYear" DROP COLUMN "metadataId";

-- AlterTable
ALTER TABLE "BiogenicEmissions" DROP COLUMN "metadataId",
ADD COLUMN     "emissionsId" INTEGER;

-- AlterTable
ALTER TABLE "Economy" DROP COLUMN "employeesId",
ADD COLUMN     "reportingPeriodId" INTEGER;

-- AlterTable
ALTER TABLE "Emissions" DROP COLUMN "biogenicEmissionsId",
DROP COLUMN "scope1And2Id",
DROP COLUMN "scope1Id",
DROP COLUMN "scope2Id",
DROP COLUMN "scope3Id",
DROP COLUMN "statedTotalEmissionsId",
ADD COLUMN     "reportingPeriodId" INTEGER;

-- AlterTable
ALTER TABLE "Employees" DROP COLUMN "metadataId",
ADD COLUMN     "economyId" INTEGER;

-- AlterTable
ALTER TABLE "Goal" DROP COLUMN "metadataId";

-- AlterTable
ALTER TABLE "Industry" DROP COLUMN "metadataId";

-- AlterTable
ALTER TABLE "Initiative" DROP COLUMN "metadataId";

-- AlterTable
ALTER TABLE "Metadata" ADD COLUMN     "baseYearId" INTEGER,
ADD COLUMN     "biogenicEmissionsId" INTEGER,
ADD COLUMN     "categoryId" INTEGER,
ADD COLUMN     "employeesId" INTEGER,
ADD COLUMN     "goalId" INTEGER,
ADD COLUMN     "industryId" INTEGER,
ADD COLUMN     "initiativeId" INTEGER,
ADD COLUMN     "reportingPeriodId" INTEGER,
ADD COLUMN     "scope1And2Id" INTEGER,
ADD COLUMN     "scope1Id" INTEGER,
ADD COLUMN     "scope2Id" INTEGER,
ADD COLUMN     "scope3Id" INTEGER,
ADD COLUMN     "statedTotalEmissionsId" INTEGER,
ADD COLUMN     "turnoverId" INTEGER;

-- AlterTable
ALTER TABLE "ReportingPeriod" DROP CONSTRAINT "ReportingPeriod_pkey",
DROP COLUMN "economyId",
DROP COLUMN "emissionsId",
DROP COLUMN "metadataId",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "ReportingPeriod_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Scope1" DROP COLUMN "metadataId",
ADD COLUMN     "emissionsId" INTEGER;

-- AlterTable
ALTER TABLE "Scope1And2" DROP COLUMN "metadataId",
ADD COLUMN     "emissionsId" INTEGER;

-- AlterTable
ALTER TABLE "Scope2" DROP COLUMN "metadataId",
ADD COLUMN     "emissionsId" INTEGER;

-- AlterTable
ALTER TABLE "Scope3" DROP COLUMN "metadataId",
ADD COLUMN     "emissionsId" INTEGER;

-- AlterTable
ALTER TABLE "Scope3Category" DROP COLUMN "metadataId";

-- AlterTable
ALTER TABLE "StatedTotalEmissions" DROP COLUMN "metadataId",
ADD COLUMN     "emissionsId" INTEGER;

-- AlterTable
ALTER TABLE "Turnover" DROP COLUMN "metadataId",
ADD COLUMN     "economyId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "BiogenicEmissions_emissionsId_key" ON "BiogenicEmissions"("emissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "Economy_reportingPeriodId_key" ON "Economy"("reportingPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "Emissions_reportingPeriodId_key" ON "Emissions"("reportingPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "Employees_economyId_key" ON "Employees"("economyId");

-- CreateIndex
CREATE UNIQUE INDEX "Metadata_goalId_key" ON "Metadata"("goalId");

-- CreateIndex
CREATE UNIQUE INDEX "Metadata_initiativeId_key" ON "Metadata"("initiativeId");

-- CreateIndex
CREATE UNIQUE INDEX "Metadata_scope1Id_key" ON "Metadata"("scope1Id");

-- CreateIndex
CREATE UNIQUE INDEX "Metadata_scope2Id_key" ON "Metadata"("scope2Id");

-- CreateIndex
CREATE UNIQUE INDEX "Metadata_scope3Id_key" ON "Metadata"("scope3Id");

-- CreateIndex
CREATE UNIQUE INDEX "Metadata_scope1And2Id_key" ON "Metadata"("scope1And2Id");

-- CreateIndex
CREATE UNIQUE INDEX "Metadata_reportingPeriodId_key" ON "Metadata"("reportingPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "Metadata_baseYearId_key" ON "Metadata"("baseYearId");

-- CreateIndex
CREATE UNIQUE INDEX "Metadata_biogenicEmissionsId_key" ON "Metadata"("biogenicEmissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "Metadata_statedTotalEmissionsId_key" ON "Metadata"("statedTotalEmissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "Metadata_industryId_key" ON "Metadata"("industryId");

-- CreateIndex
CREATE UNIQUE INDEX "Metadata_categoryId_key" ON "Metadata"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Metadata_turnoverId_key" ON "Metadata"("turnoverId");

-- CreateIndex
CREATE UNIQUE INDEX "Metadata_employeesId_key" ON "Metadata"("employeesId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportingPeriod_companyId_year_key" ON "ReportingPeriod"("companyId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Scope1_emissionsId_key" ON "Scope1"("emissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "Scope1And2_emissionsId_key" ON "Scope1And2"("emissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "Scope2_emissionsId_key" ON "Scope2"("emissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "Scope3_emissionsId_key" ON "Scope3"("emissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "StatedTotalEmissions_emissionsId_key" ON "StatedTotalEmissions"("emissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "Turnover_economyId_key" ON "Turnover"("economyId");

-- AddForeignKey
ALTER TABLE "BaseYear" ADD CONSTRAINT "BaseYear_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("wikidataId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Industry" ADD CONSTRAINT "Industry_companyWikidataId_fkey" FOREIGN KEY ("companyWikidataId") REFERENCES "Company"("wikidataId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportingPeriod" ADD CONSTRAINT "ReportingPeriod_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("wikidataId") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("wikidataId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("wikidataId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_scope1Id_fkey" FOREIGN KEY ("scope1Id") REFERENCES "Scope1"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_scope2Id_fkey" FOREIGN KEY ("scope2Id") REFERENCES "Scope2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_scope3Id_fkey" FOREIGN KEY ("scope3Id") REFERENCES "Scope3"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_scope1And2Id_fkey" FOREIGN KEY ("scope1And2Id") REFERENCES "Scope1And2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_baseYearId_fkey" FOREIGN KEY ("baseYearId") REFERENCES "BaseYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_biogenicEmissionsId_fkey" FOREIGN KEY ("biogenicEmissionsId") REFERENCES "BiogenicEmissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_statedTotalEmissionsId_fkey" FOREIGN KEY ("statedTotalEmissionsId") REFERENCES "StatedTotalEmissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Scope3Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_turnoverId_fkey" FOREIGN KEY ("turnoverId") REFERENCES "Turnover"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_employeesId_fkey" FOREIGN KEY ("employeesId") REFERENCES "Employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
