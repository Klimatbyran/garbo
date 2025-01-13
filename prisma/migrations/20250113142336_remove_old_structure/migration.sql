/*
  Warnings:

  - You are about to drop the `BaseYear` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BiogenicEmissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Company` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Economy` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Emissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Employees` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Goal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Industry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `IndustryGics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Initiative` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Metadata` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReportingPeriod` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Scope1` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Scope1And2` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Scope2` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Scope3` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Scope3Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StatedTotalEmissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Turnover` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

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
ALTER TABLE "Industry" DROP CONSTRAINT "Industry_gicsSubIndustryCode_fkey";

-- DropForeignKey
ALTER TABLE "Industry" DROP CONSTRAINT "Industry_metadataId_fkey";

-- DropForeignKey
ALTER TABLE "Initiative" DROP CONSTRAINT "Initiative_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Initiative" DROP CONSTRAINT "Initiative_metadataId_fkey";

-- DropForeignKey
ALTER TABLE "Metadata" DROP CONSTRAINT "Metadata_userId_fkey";

-- DropForeignKey
ALTER TABLE "Metadata" DROP CONSTRAINT "Metadata_verifiedByUserId_fkey";

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

-- DropTable
DROP TABLE "BaseYear";

-- DropTable
DROP TABLE "BiogenicEmissions";

-- DropTable
DROP TABLE "Company";

-- DropTable
DROP TABLE "Economy";

-- DropTable
DROP TABLE "Emissions";

-- DropTable
DROP TABLE "Employees";

-- DropTable
DROP TABLE "Goal";

-- DropTable
DROP TABLE "Industry";

-- DropTable
DROP TABLE "IndustryGics";

-- DropTable
DROP TABLE "Initiative";

-- DropTable
DROP TABLE "Metadata";

-- DropTable
DROP TABLE "ReportingPeriod";

-- DropTable
DROP TABLE "Scope1";

-- DropTable
DROP TABLE "Scope1And2";

-- DropTable
DROP TABLE "Scope2";

-- DropTable
DROP TABLE "Scope3";

-- DropTable
DROP TABLE "Scope3Category";

-- DropTable
DROP TABLE "StatedTotalEmissions";

-- DropTable
DROP TABLE "Turnover";

-- DropTable
DROP TABLE "User";
