/*
  Warnings:

  - You are about to drop the `FiscalYear` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Scope3Category` table. If the table is not empty, all the data it contains will be lost.
  - The primary key for the `Company` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `industryGicsId` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `fiscalYearId` on the `Economy` table. All the data in the column will be lost.
  - You are about to drop the column `fiscalYearId` on the `Emissions` table. All the data in the column will be lost.
  - The primary key for the `IndustryGics` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `IndustryGics` table. All the data in the column will be lost.
  - You are about to drop the column `baseYear` on the `Scope1` table. All the data in the column will be lost.
  - You are about to drop the column `baseYear` on the `Scope2` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `Scope2` table. All the data in the column will be lost.
  - You are about to drop the column `baseYear` on the `Scope3` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `metadata` table. All the data in the column will be lost.
  - Added the required column `industryGicsCode` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Made the column `wikidataId` on table `Company` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `reportingPeriodId` to the `Economy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reportingPeriodId` to the `Emissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sourceId` to the `metadata` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "FiscalYear";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Scope3Category";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "BaseYear" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "year" INTEGER NOT NULL,
    "scope" INTEGER NOT NULL,
    "companyId" TEXT NOT NULL,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "BaseYear_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BaseYear_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("wikidataId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReportingPeriod" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    "emissionsId" INTEGER NOT NULL,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "ReportingPeriod_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReportingPeriod_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("wikidataId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Source" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT,
    "comment" TEXT
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Company" (
    "wikidataId" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "industryGicsCode" TEXT NOT NULL,
    CONSTRAINT "Company_industryGicsCode_fkey" FOREIGN KEY ("industryGicsCode") REFERENCES "IndustryGics" ("subIndustryCode") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Company" ("description", "name", "url", "wikidataId") SELECT "description", "name", "url", "wikidataId" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");
CREATE TABLE "new_Economy" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "turnover" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "employees" INTEGER NOT NULL,
    "metadataId" INTEGER NOT NULL,
    "reportingPeriodId" INTEGER NOT NULL,
    CONSTRAINT "Economy_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Economy_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Economy" ("employees", "id", "metadataId", "turnover", "unit") SELECT "employees", "id", "metadataId", "turnover", "unit" FROM "Economy";
DROP TABLE "Economy";
ALTER TABLE "new_Economy" RENAME TO "Economy";
CREATE UNIQUE INDEX "Economy_reportingPeriodId_key" ON "Economy"("reportingPeriodId");
CREATE TABLE "new_Emissions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reportingPeriodId" INTEGER NOT NULL,
    "scope1Id" INTEGER NOT NULL,
    "scope2Id" INTEGER NOT NULL,
    "scope3Id" INTEGER NOT NULL,
    CONSTRAINT "Emissions_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Emissions" ("id", "scope1Id", "scope2Id", "scope3Id") SELECT "id", "scope1Id", "scope2Id", "scope3Id" FROM "Emissions";
DROP TABLE "Emissions";
ALTER TABLE "new_Emissions" RENAME TO "Emissions";
CREATE UNIQUE INDEX "Emissions_reportingPeriodId_key" ON "Emissions"("reportingPeriodId");
CREATE TABLE "new_Goal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "description" TEXT NOT NULL,
    "year" TEXT,
    "target" REAL,
    "baseYear" TEXT NOT NULL,
    "metadataId" INTEGER NOT NULL,
    "companyId" TEXT NOT NULL,
    "reportingPeriodId" INTEGER,
    CONSTRAINT "Goal_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Goal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("wikidataId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Goal_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Goal" ("baseYear", "companyId", "description", "id", "metadataId", "target", "year") SELECT "baseYear", "companyId", "description", "id", "metadataId", "target", "year" FROM "Goal";
DROP TABLE "Goal";
ALTER TABLE "new_Goal" RENAME TO "Goal";
CREATE TABLE "new_IndustryGics" (
    "sectorCode" TEXT NOT NULL,
    "sectorName" TEXT NOT NULL,
    "groupCode" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "industryCode" TEXT NOT NULL,
    "industryName" TEXT NOT NULL,
    "subIndustryCode" TEXT NOT NULL PRIMARY KEY,
    "subIndustryName" TEXT NOT NULL
);
INSERT INTO "new_IndustryGics" ("groupCode", "groupName", "industryCode", "industryName", "sectorCode", "sectorName", "subIndustryCode", "subIndustryName") SELECT "groupCode", "groupName", "industryCode", "industryName", "sectorCode", "sectorName", "subIndustryCode", "subIndustryName" FROM "IndustryGics";
DROP TABLE "IndustryGics";
ALTER TABLE "new_IndustryGics" RENAME TO "IndustryGics";
CREATE TABLE "new_Initiative" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "year" TEXT,
    "scope" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "metadataId" INTEGER NOT NULL,
    "reportingPeriodId" INTEGER,
    CONSTRAINT "Initiative_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("wikidataId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Initiative_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Initiative_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Initiative" ("companyId", "description", "id", "metadataId", "scope", "title", "year") SELECT "companyId", "description", "id", "metadataId", "scope", "title", "year" FROM "Initiative";
DROP TABLE "Initiative";
ALTER TABLE "new_Initiative" RENAME TO "Initiative";
CREATE TABLE "new_Scope1" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" REAL,
    "biogenic" REAL,
    "unit" TEXT NOT NULL,
    "metadataId" INTEGER NOT NULL,
    "emissionsId" INTEGER NOT NULL,
    CONSTRAINT "Scope1_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Scope1_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Scope1" ("biogenic", "emissionsId", "id", "metadataId", "unit", "value") SELECT "biogenic", "emissionsId", "id", "metadataId", "unit", "value" FROM "Scope1";
DROP TABLE "Scope1";
ALTER TABLE "new_Scope1" RENAME TO "Scope1";
CREATE TABLE "new_Scope2" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "biogenic" REAL,
    "unit" TEXT NOT NULL,
    "mb" REAL,
    "lb" REAL,
    "metadataId" INTEGER NOT NULL,
    "emissionsId" INTEGER NOT NULL,
    CONSTRAINT "Scope2_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Scope2_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Scope2" ("biogenic", "emissionsId", "id", "lb", "mb", "metadataId", "unit") SELECT "biogenic", "emissionsId", "id", "lb", "mb", "metadataId", "unit" FROM "Scope2";
DROP TABLE "Scope2";
ALTER TABLE "new_Scope2" RENAME TO "Scope2";
CREATE UNIQUE INDEX "Scope2_emissionsId_key" ON "Scope2"("emissionsId");
CREATE TABLE "new_Scope3" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" REAL,
    "biogenic" REAL,
    "unit" TEXT NOT NULL,
    "c1_purchasedGoods" REAL,
    "c2_capitalGoods" REAL,
    "c3_fuelAndEnergyRelatedActivities" REAL,
    "c4_upstreamTransportationAndDistribution" REAL,
    "c5_wasteGeneratedInOperations" REAL,
    "c6_businessTravel" REAL,
    "c7_employeeCommuting" REAL,
    "c8_upstreamLeasedAssets" REAL,
    "c9_downstreamTransportationAndDistribution" REAL,
    "c10_processingOfSoldProducts" REAL,
    "c11_useOfSoldProducts" REAL,
    "c12_endOfLifeTreatmentOfSoldProducts" REAL,
    "c13_downstreamLeasedAssets" REAL,
    "c14_franchises" REAL,
    "c15_investments" REAL,
    "c16_other" REAL,
    "sourceId" INTEGER NOT NULL,
    "emissionsId" INTEGER NOT NULL,
    CONSTRAINT "Scope3_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Scope3_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Scope3" ("biogenic", "emissionsId", "id", "sourceId", "unit", "value") SELECT "biogenic", "emissionsId", "id", "sourceId", "unit", "value" FROM "Scope3";
DROP TABLE "Scope3";
ALTER TABLE "new_Scope3" RENAME TO "Scope3";
CREATE UNIQUE INDEX "Scope3_emissionsId_key" ON "Scope3"("emissionsId");
CREATE TABLE "new_metadata" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "comment" TEXT,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "sourceId" INTEGER NOT NULL,
    CONSTRAINT "metadata_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_metadata" ("comment", "id", "lastUpdated", "userId") SELECT "comment", "id", "lastUpdated", "userId" FROM "metadata";
DROP TABLE "metadata";
ALTER TABLE "new_metadata" RENAME TO "metadata";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Source_id_key" ON "Source"("id");
