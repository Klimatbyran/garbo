/*
  Warnings:

  - You are about to drop the `BaseYear2` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BiogenicEmissions2` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Company2` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Economy2` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Emissions2` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Employees2` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Goal2` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Industry2` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `IndustryGics2` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Initiative2` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Metadata2` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReportingPeriod2` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Scope12` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Scope1And22` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Scope22` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Scope32` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Scope3Category2` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StatedTotalEmissions2` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Turnover2` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User2` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BaseYear2" DROP CONSTRAINT "BaseYear2_companyId_fkey";

-- DropForeignKey
ALTER TABLE "BiogenicEmissions2" DROP CONSTRAINT "BiogenicEmissions2_emissionsId_fkey";

-- DropForeignKey
ALTER TABLE "Economy2" DROP CONSTRAINT "Economy2_reportingPeriodId_fkey";

-- DropForeignKey
ALTER TABLE "Emissions2" DROP CONSTRAINT "Emissions2_reportingPeriodId_fkey";

-- DropForeignKey
ALTER TABLE "Employees2" DROP CONSTRAINT "Employees2_economyId_fkey";

-- DropForeignKey
ALTER TABLE "Goal2" DROP CONSTRAINT "Goal2_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Industry2" DROP CONSTRAINT "Industry2_companyWikidataId_fkey";

-- DropForeignKey
ALTER TABLE "Industry2" DROP CONSTRAINT "Industry2_gicsSubIndustryCode_fkey";

-- DropForeignKey
ALTER TABLE "Initiative2" DROP CONSTRAINT "Initiative2_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Metadata2" DROP CONSTRAINT "Metadata2_baseYearId_fkey";

-- DropForeignKey
ALTER TABLE "Metadata2" DROP CONSTRAINT "Metadata2_biogenicEmissionsId_fkey";

-- DropForeignKey
ALTER TABLE "Metadata2" DROP CONSTRAINT "Metadata2_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Metadata2" DROP CONSTRAINT "Metadata2_employeesId_fkey";

-- DropForeignKey
ALTER TABLE "Metadata2" DROP CONSTRAINT "Metadata2_goalId_fkey";

-- DropForeignKey
ALTER TABLE "Metadata2" DROP CONSTRAINT "Metadata2_industryId_fkey";

-- DropForeignKey
ALTER TABLE "Metadata2" DROP CONSTRAINT "Metadata2_initiativeId_fkey";

-- DropForeignKey
ALTER TABLE "Metadata2" DROP CONSTRAINT "Metadata2_reportingPeriodId_fkey";

-- DropForeignKey
ALTER TABLE "Metadata2" DROP CONSTRAINT "Metadata2_scope1And2Id_fkey";

-- DropForeignKey
ALTER TABLE "Metadata2" DROP CONSTRAINT "Metadata2_scope1Id_fkey";

-- DropForeignKey
ALTER TABLE "Metadata2" DROP CONSTRAINT "Metadata2_scope2Id_fkey";

-- DropForeignKey
ALTER TABLE "Metadata2" DROP CONSTRAINT "Metadata2_scope3Id_fkey";

-- DropForeignKey
ALTER TABLE "Metadata2" DROP CONSTRAINT "Metadata2_statedTotalEmissionsId_fkey";

-- DropForeignKey
ALTER TABLE "Metadata2" DROP CONSTRAINT "Metadata2_turnoverId_fkey";

-- DropForeignKey
ALTER TABLE "Metadata2" DROP CONSTRAINT "Metadata2_userId_fkey";

-- DropForeignKey
ALTER TABLE "Metadata2" DROP CONSTRAINT "Metadata2_verifiedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "ReportingPeriod2" DROP CONSTRAINT "ReportingPeriod2_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Scope12" DROP CONSTRAINT "Scope12_emissionsId_fkey";

-- DropForeignKey
ALTER TABLE "Scope1And22" DROP CONSTRAINT "Scope1And22_emissionsId_fkey";

-- DropForeignKey
ALTER TABLE "Scope22" DROP CONSTRAINT "Scope22_emissionsId_fkey";

-- DropForeignKey
ALTER TABLE "Scope32" DROP CONSTRAINT "Scope32_emissionsId_fkey";

-- DropForeignKey
ALTER TABLE "Scope3Category2" DROP CONSTRAINT "Scope3Category2_scope3Id_fkey";

-- DropForeignKey
ALTER TABLE "StatedTotalEmissions2" DROP CONSTRAINT "StatedTotalEmissions2_emissionsId_fkey";

-- DropForeignKey
ALTER TABLE "StatedTotalEmissions2" DROP CONSTRAINT "StatedTotalEmissions2_scope3Id_fkey";

-- DropForeignKey
ALTER TABLE "Turnover2" DROP CONSTRAINT "Turnover2_economyId_fkey";

-- DropTable
DROP TABLE "BaseYear2";

-- DropTable
DROP TABLE "BiogenicEmissions2";

-- DropTable
DROP TABLE "Company2";

-- DropTable
DROP TABLE "Economy2";

-- DropTable
DROP TABLE "Emissions2";

-- DropTable
DROP TABLE "Employees2";

-- DropTable
DROP TABLE "Goal2";

-- DropTable
DROP TABLE "Industry2";

-- DropTable
DROP TABLE "IndustryGics2";

-- DropTable
DROP TABLE "Initiative2";

-- DropTable
DROP TABLE "Metadata2";

-- DropTable
DROP TABLE "ReportingPeriod2";

-- DropTable
DROP TABLE "Scope12";

-- DropTable
DROP TABLE "Scope1And22";

-- DropTable
DROP TABLE "Scope22";

-- DropTable
DROP TABLE "Scope32";

-- DropTable
DROP TABLE "Scope3Category2";

-- DropTable
DROP TABLE "StatedTotalEmissions2";

-- DropTable
DROP TABLE "Turnover2";

-- DropTable
DROP TABLE "User2";
