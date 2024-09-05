/*
  Warnings:

  - You are about to drop the `metadata` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `sourceId` on the `Scope3` table. All the data in the column will be lost.
  - Added the required column `metadataId` to the `Scope3` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "metadata";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Metadata" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "comment" TEXT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "sourceId" INTEGER NOT NULL,
    CONSTRAINT "Metadata_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Metadata_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BaseYear" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "year" INTEGER NOT NULL,
    "scope" INTEGER NOT NULL,
    "companyId" TEXT NOT NULL,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "BaseYear_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BaseYear_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("wikidataId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BaseYear" ("companyId", "id", "metadataId", "scope", "year") SELECT "companyId", "id", "metadataId", "scope", "year" FROM "BaseYear";
DROP TABLE "BaseYear";
ALTER TABLE "new_BaseYear" RENAME TO "BaseYear";
CREATE TABLE "new_BiogenicEmissions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "total" REAL,
    "unit" TEXT NOT NULL,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "BiogenicEmissions_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BiogenicEmissions" ("id", "metadataId", "total", "unit") SELECT "id", "metadataId", "total", "unit" FROM "BiogenicEmissions";
DROP TABLE "BiogenicEmissions";
ALTER TABLE "new_BiogenicEmissions" RENAME TO "BiogenicEmissions";
CREATE TABLE "new_DataOrigin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "DataOrigin_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DataOrigin" ("id", "metadataId", "name") SELECT "id", "metadataId", "name" FROM "DataOrigin";
DROP TABLE "DataOrigin";
ALTER TABLE "new_DataOrigin" RENAME TO "DataOrigin";
CREATE UNIQUE INDEX "DataOrigin_metadataId_key" ON "DataOrigin"("metadataId");
CREATE TABLE "new_Economy" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "turnover" REAL,
    "currencyId" INTEGER,
    "employees" REAL,
    "employeesUnit" TEXT,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "Economy_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Economy_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Economy" ("currencyId", "employees", "employeesUnit", "id", "metadataId", "turnover") SELECT "currencyId", "employees", "employeesUnit", "id", "metadataId", "turnover" FROM "Economy";
DROP TABLE "Economy";
ALTER TABLE "new_Economy" RENAME TO "Economy";
CREATE TABLE "new_Goal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "description" TEXT NOT NULL,
    "year" TEXT,
    "target" REAL,
    "baseYear" TEXT,
    "metadataId" INTEGER NOT NULL,
    "companyId" TEXT NOT NULL,
    "reportingPeriodId" INTEGER,
    CONSTRAINT "Goal_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Goal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("wikidataId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Goal_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Goal" ("baseYear", "companyId", "description", "id", "metadataId", "reportingPeriodId", "target", "year") SELECT "baseYear", "companyId", "description", "id", "metadataId", "reportingPeriodId", "target", "year" FROM "Goal";
DROP TABLE "Goal";
ALTER TABLE "new_Goal" RENAME TO "Goal";
CREATE TABLE "new_Initiative" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "year" TEXT,
    "scope" TEXT,
    "companyId" TEXT NOT NULL,
    "metadataId" INTEGER NOT NULL,
    "reportingPeriodId" INTEGER,
    CONSTRAINT "Initiative_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("wikidataId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Initiative_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Initiative_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Initiative" ("companyId", "description", "id", "metadataId", "reportingPeriodId", "scope", "title", "year") SELECT "companyId", "description", "id", "metadataId", "reportingPeriodId", "scope", "title", "year" FROM "Initiative";
DROP TABLE "Initiative";
ALTER TABLE "new_Initiative" RENAME TO "Initiative";
CREATE TABLE "new_ReportingPeriod" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    "emissionsId" INTEGER,
    "economyId" INTEGER,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "ReportingPeriod_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReportingPeriod_economyId_fkey" FOREIGN KEY ("economyId") REFERENCES "Economy" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ReportingPeriod_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ReportingPeriod_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("wikidataId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ReportingPeriod" ("companyId", "economyId", "emissionsId", "endDate", "id", "metadataId", "startDate") SELECT "companyId", "economyId", "emissionsId", "endDate", "id", "metadataId", "startDate" FROM "ReportingPeriod";
DROP TABLE "ReportingPeriod";
ALTER TABLE "new_ReportingPeriod" RENAME TO "ReportingPeriod";
CREATE UNIQUE INDEX "ReportingPeriod_emissionsId_key" ON "ReportingPeriod"("emissionsId");
CREATE UNIQUE INDEX "ReportingPeriod_economyId_key" ON "ReportingPeriod"("economyId");
CREATE TABLE "new_Scope1" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "total" REAL,
    "unit" TEXT NOT NULL,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "Scope1_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Scope1" ("id", "metadataId", "total", "unit") SELECT "id", "metadataId", "total", "unit" FROM "Scope1";
DROP TABLE "Scope1";
ALTER TABLE "new_Scope1" RENAME TO "Scope1";
CREATE TABLE "new_Scope1And2" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "total" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "Scope1And2_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Scope1And2" ("id", "metadataId", "total", "unit") SELECT "id", "metadataId", "total", "unit" FROM "Scope1And2";
DROP TABLE "Scope1And2";
ALTER TABLE "new_Scope1And2" RENAME TO "Scope1And2";
CREATE TABLE "new_Scope2" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "unit" TEXT NOT NULL,
    "mb" REAL,
    "lb" REAL,
    "unknown" REAL,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "Scope2_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Scope2" ("id", "lb", "mb", "metadataId", "unit", "unknown") SELECT "id", "lb", "mb", "metadataId", "unit", "unknown" FROM "Scope2";
DROP TABLE "Scope2";
ALTER TABLE "new_Scope2" RENAME TO "Scope2";
CREATE TABLE "new_Scope3" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "statedTotalEmissionsId" INTEGER,
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
    "other" REAL,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "Scope3_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Scope3" ("c10_processingOfSoldProducts", "c11_useOfSoldProducts", "c12_endOfLifeTreatmentOfSoldProducts", "c13_downstreamLeasedAssets", "c14_franchises", "c15_investments", "c1_purchasedGoods", "c2_capitalGoods", "c3_fuelAndEnergyRelatedActivities", "c4_upstreamTransportationAndDistribution", "c5_wasteGeneratedInOperations", "c6_businessTravel", "c7_employeeCommuting", "c8_upstreamLeasedAssets", "c9_downstreamTransportationAndDistribution", "id", "other", "statedTotalEmissionsId", "unit") SELECT "c10_processingOfSoldProducts", "c11_useOfSoldProducts", "c12_endOfLifeTreatmentOfSoldProducts", "c13_downstreamLeasedAssets", "c14_franchises", "c15_investments", "c1_purchasedGoods", "c2_capitalGoods", "c3_fuelAndEnergyRelatedActivities", "c4_upstreamTransportationAndDistribution", "c5_wasteGeneratedInOperations", "c6_businessTravel", "c7_employeeCommuting", "c8_upstreamLeasedAssets", "c9_downstreamTransportationAndDistribution", "id", "other", "statedTotalEmissionsId", "unit" FROM "Scope3";
DROP TABLE "Scope3";
ALTER TABLE "new_Scope3" RENAME TO "Scope3";
CREATE UNIQUE INDEX "Scope3_statedTotalEmissionsId_key" ON "Scope3"("statedTotalEmissionsId");
CREATE TABLE "new_StatedTotalEmissions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "total" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "metadataId" INTEGER NOT NULL,
    "scope3Id" INTEGER,
    CONSTRAINT "StatedTotalEmissions_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StatedTotalEmissions_scope3Id_fkey" FOREIGN KEY ("scope3Id") REFERENCES "Scope3" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_StatedTotalEmissions" ("id", "metadataId", "scope3Id", "total", "unit") SELECT "id", "metadataId", "scope3Id", "total", "unit" FROM "StatedTotalEmissions";
DROP TABLE "StatedTotalEmissions";
ALTER TABLE "new_StatedTotalEmissions" RENAME TO "StatedTotalEmissions";
CREATE UNIQUE INDEX "StatedTotalEmissions_scope3Id_key" ON "StatedTotalEmissions"("scope3Id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
