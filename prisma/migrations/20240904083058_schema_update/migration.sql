/*
  Warnings:

  - You are about to drop the column `biogenic` on the `Scope1` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `Scope1` table. All the data in the column will be lost.
  - You are about to drop the column `biogenic` on the `Scope2` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `Scope2` table. All the data in the column will be lost.
  - You are about to drop the column `biogenic` on the `Scope3` table. All the data in the column will be lost.
  - You are about to drop the column `c16_other` on the `Scope3` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `Scope3` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Company_name_key";

-- CreateTable
CREATE TABLE "StatedTotalEmissions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "total" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "emissionsId" INTEGER NOT NULL,
    "metadataId" INTEGER NOT NULL,
    "scope3Id" INTEGER NOT NULL,
    CONSTRAINT "StatedTotalEmissions_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StatedTotalEmissions_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StatedTotalEmissions_scope3Id_fkey" FOREIGN KEY ("scope3Id") REFERENCES "Scope3" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Scope1And2" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "total" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "emissionsId" INTEGER NOT NULL,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "Scope1And2_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Scope1And2_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BiogenicEmissions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "total" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "metadataId" INTEGER NOT NULL,
    "emissionsId" INTEGER NOT NULL,
    CONSTRAINT "BiogenicEmissions_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BiogenicEmissions_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DataOrigin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "DataOrigin_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmissionUnit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "unit" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Emissions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reportingPeriodId" INTEGER NOT NULL,
    "scope1Id" INTEGER NOT NULL,
    "scope2Id" INTEGER NOT NULL,
    "scope3Id" INTEGER NOT NULL,
    "biogenicEmissionsId" INTEGER,
    "scope1And2Id" INTEGER,
    "statedTotalEmissionsId" INTEGER,
    CONSTRAINT "Emissions_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Emissions_scope1Id_fkey" FOREIGN KEY ("scope1Id") REFERENCES "Scope1" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Emissions_scope2Id_fkey" FOREIGN KEY ("scope2Id") REFERENCES "Scope2" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Emissions_scope3Id_fkey" FOREIGN KEY ("scope3Id") REFERENCES "Scope3" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Emissions" ("id", "reportingPeriodId", "scope1Id", "scope2Id", "scope3Id") SELECT "id", "reportingPeriodId", "scope1Id", "scope2Id", "scope3Id" FROM "Emissions";
DROP TABLE "Emissions";
ALTER TABLE "new_Emissions" RENAME TO "Emissions";
CREATE UNIQUE INDEX "Emissions_reportingPeriodId_key" ON "Emissions"("reportingPeriodId");
CREATE UNIQUE INDEX "Emissions_scope1Id_key" ON "Emissions"("scope1Id");
CREATE UNIQUE INDEX "Emissions_scope2Id_key" ON "Emissions"("scope2Id");
CREATE UNIQUE INDEX "Emissions_scope3Id_key" ON "Emissions"("scope3Id");
CREATE UNIQUE INDEX "Emissions_biogenicEmissionsId_key" ON "Emissions"("biogenicEmissionsId");
CREATE UNIQUE INDEX "Emissions_scope1And2Id_key" ON "Emissions"("scope1And2Id");
CREATE UNIQUE INDEX "Emissions_statedTotalEmissionsId_key" ON "Emissions"("statedTotalEmissionsId");
CREATE TABLE "new_ReportingPeriod" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    "emissionsId" INTEGER,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "ReportingPeriod_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReportingPeriod_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("wikidataId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ReportingPeriod" ("companyId", "emissionsId", "endDate", "id", "metadataId", "startDate") SELECT "companyId", "emissionsId", "endDate", "id", "metadataId", "startDate" FROM "ReportingPeriod";
DROP TABLE "ReportingPeriod";
ALTER TABLE "new_ReportingPeriod" RENAME TO "ReportingPeriod";
CREATE TABLE "new_Scope1" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "total" REAL,
    "unit" TEXT NOT NULL,
    "metadataId" INTEGER NOT NULL,
    "emissionsId" INTEGER NOT NULL,
    CONSTRAINT "Scope1_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Scope1" ("emissionsId", "id", "metadataId", "unit") SELECT "emissionsId", "id", "metadataId", "unit" FROM "Scope1";
DROP TABLE "Scope1";
ALTER TABLE "new_Scope1" RENAME TO "Scope1";
CREATE UNIQUE INDEX "Scope1_emissionsId_key" ON "Scope1"("emissionsId");
CREATE TABLE "new_Scope2" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "unit" TEXT NOT NULL,
    "mb" REAL,
    "lb" REAL,
    "unknown" REAL,
    "metadataId" INTEGER NOT NULL,
    "emissionsId" INTEGER NOT NULL,
    CONSTRAINT "Scope2_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Scope2" ("emissionsId", "id", "lb", "mb", "metadataId", "unit") SELECT "emissionsId", "id", "lb", "mb", "metadataId", "unit" FROM "Scope2";
DROP TABLE "Scope2";
ALTER TABLE "new_Scope2" RENAME TO "Scope2";
CREATE UNIQUE INDEX "Scope2_emissionsId_key" ON "Scope2"("emissionsId");
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
    "sourceId" INTEGER NOT NULL,
    "emissionsId" INTEGER NOT NULL,
    CONSTRAINT "Scope3_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Scope3" ("c10_processingOfSoldProducts", "c11_useOfSoldProducts", "c12_endOfLifeTreatmentOfSoldProducts", "c13_downstreamLeasedAssets", "c14_franchises", "c15_investments", "c1_purchasedGoods", "c2_capitalGoods", "c3_fuelAndEnergyRelatedActivities", "c4_upstreamTransportationAndDistribution", "c5_wasteGeneratedInOperations", "c6_businessTravel", "c7_employeeCommuting", "c8_upstreamLeasedAssets", "c9_downstreamTransportationAndDistribution", "emissionsId", "id", "sourceId", "unit") SELECT "c10_processingOfSoldProducts", "c11_useOfSoldProducts", "c12_endOfLifeTreatmentOfSoldProducts", "c13_downstreamLeasedAssets", "c14_franchises", "c15_investments", "c1_purchasedGoods", "c2_capitalGoods", "c3_fuelAndEnergyRelatedActivities", "c4_upstreamTransportationAndDistribution", "c5_wasteGeneratedInOperations", "c6_businessTravel", "c7_employeeCommuting", "c8_upstreamLeasedAssets", "c9_downstreamTransportationAndDistribution", "emissionsId", "id", "sourceId", "unit" FROM "Scope3";
DROP TABLE "Scope3";
ALTER TABLE "new_Scope3" RENAME TO "Scope3";
CREATE UNIQUE INDEX "Scope3_statedTotalEmissionsId_key" ON "Scope3"("statedTotalEmissionsId");
CREATE UNIQUE INDEX "Scope3_emissionsId_key" ON "Scope3"("emissionsId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "StatedTotalEmissions_emissionsId_key" ON "StatedTotalEmissions"("emissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "StatedTotalEmissions_scope3Id_key" ON "StatedTotalEmissions"("scope3Id");

-- CreateIndex
CREATE UNIQUE INDEX "Scope1And2_emissionsId_key" ON "Scope1And2"("emissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "BiogenicEmissions_emissionsId_key" ON "BiogenicEmissions"("emissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "DataOrigin_metadataId_key" ON "DataOrigin"("metadataId");
