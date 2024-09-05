/*
  Warnings:

  - You are about to drop the column `unit` on the `BiogenicEmissions` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `EmissionUnit` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `Scope1` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `Scope1And2` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `Scope2` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `Scope3` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `StatedTotalEmissions` table. All the data in the column will be lost.
  - Added the required column `unitId` to the `BiogenicEmissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `EmissionUnit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitId` to the `Scope1` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitId` to the `Scope1And2` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitId` to the `Scope2` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitId` to the `Scope3` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitId` to the `StatedTotalEmissions` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BiogenicEmissions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "total" REAL,
    "metadataId" INTEGER NOT NULL,
    "unitId" INTEGER NOT NULL,
    CONSTRAINT "BiogenicEmissions_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "EmissionUnit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BiogenicEmissions_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BiogenicEmissions" ("id", "metadataId", "total") SELECT "id", "metadataId", "total" FROM "BiogenicEmissions";
DROP TABLE "BiogenicEmissions";
ALTER TABLE "new_BiogenicEmissions" RENAME TO "BiogenicEmissions";
CREATE TABLE "new_EmissionUnit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);
INSERT INTO "new_EmissionUnit" ("id") SELECT "id" FROM "EmissionUnit";
DROP TABLE "EmissionUnit";
ALTER TABLE "new_EmissionUnit" RENAME TO "EmissionUnit";
CREATE UNIQUE INDEX "EmissionUnit_name_key" ON "EmissionUnit"("name");
CREATE TABLE "new_Scope1" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "total" REAL,
    "metadataId" INTEGER NOT NULL,
    "unitId" INTEGER NOT NULL,
    CONSTRAINT "Scope1_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "EmissionUnit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Scope1_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Scope1" ("id", "metadataId", "total") SELECT "id", "metadataId", "total" FROM "Scope1";
DROP TABLE "Scope1";
ALTER TABLE "new_Scope1" RENAME TO "Scope1";
CREATE TABLE "new_Scope1And2" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "total" REAL NOT NULL,
    "metadataId" INTEGER NOT NULL,
    "unitId" INTEGER NOT NULL,
    CONSTRAINT "Scope1And2_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "EmissionUnit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Scope1And2_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Scope1And2" ("id", "metadataId", "total") SELECT "id", "metadataId", "total" FROM "Scope1And2";
DROP TABLE "Scope1And2";
ALTER TABLE "new_Scope1And2" RENAME TO "Scope1And2";
CREATE TABLE "new_Scope2" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mb" REAL,
    "lb" REAL,
    "unknown" REAL,
    "metadataId" INTEGER NOT NULL,
    "unitId" INTEGER NOT NULL,
    CONSTRAINT "Scope2_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "EmissionUnit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Scope2_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Scope2" ("id", "lb", "mb", "metadataId", "unknown") SELECT "id", "lb", "mb", "metadataId", "unknown" FROM "Scope2";
DROP TABLE "Scope2";
ALTER TABLE "new_Scope2" RENAME TO "Scope2";
CREATE TABLE "new_Scope3" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "statedTotalEmissionsId" INTEGER,
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
    "unitId" INTEGER NOT NULL,
    CONSTRAINT "Scope3_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "EmissionUnit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Scope3_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Scope3" ("c10_processingOfSoldProducts", "c11_useOfSoldProducts", "c12_endOfLifeTreatmentOfSoldProducts", "c13_downstreamLeasedAssets", "c14_franchises", "c15_investments", "c1_purchasedGoods", "c2_capitalGoods", "c3_fuelAndEnergyRelatedActivities", "c4_upstreamTransportationAndDistribution", "c5_wasteGeneratedInOperations", "c6_businessTravel", "c7_employeeCommuting", "c8_upstreamLeasedAssets", "c9_downstreamTransportationAndDistribution", "id", "metadataId", "other", "statedTotalEmissionsId") SELECT "c10_processingOfSoldProducts", "c11_useOfSoldProducts", "c12_endOfLifeTreatmentOfSoldProducts", "c13_downstreamLeasedAssets", "c14_franchises", "c15_investments", "c1_purchasedGoods", "c2_capitalGoods", "c3_fuelAndEnergyRelatedActivities", "c4_upstreamTransportationAndDistribution", "c5_wasteGeneratedInOperations", "c6_businessTravel", "c7_employeeCommuting", "c8_upstreamLeasedAssets", "c9_downstreamTransportationAndDistribution", "id", "metadataId", "other", "statedTotalEmissionsId" FROM "Scope3";
DROP TABLE "Scope3";
ALTER TABLE "new_Scope3" RENAME TO "Scope3";
CREATE UNIQUE INDEX "Scope3_statedTotalEmissionsId_key" ON "Scope3"("statedTotalEmissionsId");
CREATE TABLE "new_StatedTotalEmissions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "total" REAL NOT NULL,
    "unitId" INTEGER NOT NULL,
    "metadataId" INTEGER NOT NULL,
    "scope3Id" INTEGER,
    CONSTRAINT "StatedTotalEmissions_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "EmissionUnit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StatedTotalEmissions_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StatedTotalEmissions_scope3Id_fkey" FOREIGN KEY ("scope3Id") REFERENCES "Scope3" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_StatedTotalEmissions" ("id", "metadataId", "scope3Id", "total") SELECT "id", "metadataId", "scope3Id", "total" FROM "StatedTotalEmissions";
DROP TABLE "StatedTotalEmissions";
ALTER TABLE "new_StatedTotalEmissions" RENAME TO "StatedTotalEmissions";
CREATE UNIQUE INDEX "StatedTotalEmissions_scope3Id_key" ON "StatedTotalEmissions"("scope3Id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
