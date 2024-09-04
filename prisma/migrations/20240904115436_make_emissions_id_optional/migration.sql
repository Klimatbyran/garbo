/*
  Warnings:

  - You are about to drop the column `emissionsId` on the `Scope1` table. All the data in the column will be lost.
  - You are about to drop the column `emissionsId` on the `Scope2` table. All the data in the column will be lost.
  - You are about to drop the column `emissionsId` on the `Scope3` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Scope1" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "total" REAL,
    "unit" TEXT NOT NULL,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "Scope1_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Scope1" ("id", "metadataId", "total", "unit") SELECT "id", "metadataId", "total", "unit" FROM "Scope1";
DROP TABLE "Scope1";
ALTER TABLE "new_Scope1" RENAME TO "Scope1";
CREATE TABLE "new_Scope2" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "unit" TEXT NOT NULL,
    "mb" REAL,
    "lb" REAL,
    "unknown" REAL,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "Scope2_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    "sourceId" INTEGER NOT NULL,
    CONSTRAINT "Scope3_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Scope3" ("c10_processingOfSoldProducts", "c11_useOfSoldProducts", "c12_endOfLifeTreatmentOfSoldProducts", "c13_downstreamLeasedAssets", "c14_franchises", "c15_investments", "c1_purchasedGoods", "c2_capitalGoods", "c3_fuelAndEnergyRelatedActivities", "c4_upstreamTransportationAndDistribution", "c5_wasteGeneratedInOperations", "c6_businessTravel", "c7_employeeCommuting", "c8_upstreamLeasedAssets", "c9_downstreamTransportationAndDistribution", "id", "other", "sourceId", "statedTotalEmissionsId", "unit") SELECT "c10_processingOfSoldProducts", "c11_useOfSoldProducts", "c12_endOfLifeTreatmentOfSoldProducts", "c13_downstreamLeasedAssets", "c14_franchises", "c15_investments", "c1_purchasedGoods", "c2_capitalGoods", "c3_fuelAndEnergyRelatedActivities", "c4_upstreamTransportationAndDistribution", "c5_wasteGeneratedInOperations", "c6_businessTravel", "c7_employeeCommuting", "c8_upstreamLeasedAssets", "c9_downstreamTransportationAndDistribution", "id", "other", "sourceId", "statedTotalEmissionsId", "unit" FROM "Scope3";
DROP TABLE "Scope3";
ALTER TABLE "new_Scope3" RENAME TO "Scope3";
CREATE UNIQUE INDEX "Scope3_statedTotalEmissionsId_key" ON "Scope3"("statedTotalEmissionsId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
