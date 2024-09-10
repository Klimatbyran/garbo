/*
  Warnings:

  - You are about to drop the column `c10_processingOfSoldProducts` on the `Scope3` table. All the data in the column will be lost.
  - You are about to drop the column `c11_useOfSoldProducts` on the `Scope3` table. All the data in the column will be lost.
  - You are about to drop the column `c12_endOfLifeTreatmentOfSoldProducts` on the `Scope3` table. All the data in the column will be lost.
  - You are about to drop the column `c13_downstreamLeasedAssets` on the `Scope3` table. All the data in the column will be lost.
  - You are about to drop the column `c14_franchises` on the `Scope3` table. All the data in the column will be lost.
  - You are about to drop the column `c15_investments` on the `Scope3` table. All the data in the column will be lost.
  - You are about to drop the column `c1_purchasedGoods` on the `Scope3` table. All the data in the column will be lost.
  - You are about to drop the column `c2_capitalGoods` on the `Scope3` table. All the data in the column will be lost.
  - You are about to drop the column `c3_fuelAndEnergyRelatedActivities` on the `Scope3` table. All the data in the column will be lost.
  - You are about to drop the column `c4_upstreamTransportationAndDistribution` on the `Scope3` table. All the data in the column will be lost.
  - You are about to drop the column `c5_wasteGeneratedInOperations` on the `Scope3` table. All the data in the column will be lost.
  - You are about to drop the column `c6_businessTravel` on the `Scope3` table. All the data in the column will be lost.
  - You are about to drop the column `c7_employeeCommuting` on the `Scope3` table. All the data in the column will be lost.
  - You are about to drop the column `c8_upstreamLeasedAssets` on the `Scope3` table. All the data in the column will be lost.
  - You are about to drop the column `c9_downstreamTransportationAndDistribution` on the `Scope3` table. All the data in the column will be lost.
  - You are about to drop the column `other` on the `Scope3` table. All the data in the column will be lost.
  - You are about to drop the column `unitId` on the `Scope3` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Scope3Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" INTEGER NOT NULL,
    "total" REAL,
    "unitId" INTEGER NOT NULL,
    "scope3Id" INTEGER NOT NULL,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "Scope3Category_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "EmissionUnit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Scope3Category_scope3Id_fkey" FOREIGN KEY ("scope3Id") REFERENCES "Scope3" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Scope3Category_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Scope3" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "statedTotalEmissionsId" INTEGER,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "Scope3_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Scope3" ("id", "metadataId", "statedTotalEmissionsId") SELECT "id", "metadataId", "statedTotalEmissionsId" FROM "Scope3";
DROP TABLE "Scope3";
ALTER TABLE "new_Scope3" RENAME TO "Scope3";
CREATE UNIQUE INDEX "Scope3_statedTotalEmissionsId_key" ON "Scope3"("statedTotalEmissionsId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
