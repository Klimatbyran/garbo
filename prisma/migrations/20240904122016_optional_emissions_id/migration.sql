/*
  Warnings:

  - You are about to drop the column `emissionsId` on the `BiogenicEmissions` table. All the data in the column will be lost.
  - You are about to drop the column `emissionsId` on the `Scope1And2` table. All the data in the column will be lost.
  - You are about to drop the column `emissionsId` on the `StatedTotalEmissions` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BiogenicEmissions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "total" REAL,
    "unit" TEXT NOT NULL,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "BiogenicEmissions_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BiogenicEmissions" ("id", "metadataId", "total", "unit") SELECT "id", "metadataId", "total", "unit" FROM "BiogenicEmissions";
DROP TABLE "BiogenicEmissions";
ALTER TABLE "new_BiogenicEmissions" RENAME TO "BiogenicEmissions";
CREATE TABLE "new_Emissions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "scope1Id" INTEGER NOT NULL,
    "scope2Id" INTEGER NOT NULL,
    "scope3Id" INTEGER NOT NULL,
    "biogenicEmissionsId" INTEGER,
    "scope1And2Id" INTEGER,
    "statedTotalEmissionsId" INTEGER,
    CONSTRAINT "Emissions_statedTotalEmissionsId_fkey" FOREIGN KEY ("statedTotalEmissionsId") REFERENCES "StatedTotalEmissions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Emissions_scope1And2Id_fkey" FOREIGN KEY ("scope1And2Id") REFERENCES "Scope1And2" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Emissions_biogenicEmissionsId_fkey" FOREIGN KEY ("biogenicEmissionsId") REFERENCES "BiogenicEmissions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Emissions_scope1Id_fkey" FOREIGN KEY ("scope1Id") REFERENCES "Scope1" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Emissions_scope2Id_fkey" FOREIGN KEY ("scope2Id") REFERENCES "Scope2" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Emissions_scope3Id_fkey" FOREIGN KEY ("scope3Id") REFERENCES "Scope3" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Emissions" ("biogenicEmissionsId", "id", "scope1And2Id", "scope1Id", "scope2Id", "scope3Id", "statedTotalEmissionsId") SELECT "biogenicEmissionsId", "id", "scope1And2Id", "scope1Id", "scope2Id", "scope3Id", "statedTotalEmissionsId" FROM "Emissions";
DROP TABLE "Emissions";
ALTER TABLE "new_Emissions" RENAME TO "Emissions";
CREATE UNIQUE INDEX "Emissions_scope1Id_key" ON "Emissions"("scope1Id");
CREATE UNIQUE INDEX "Emissions_scope2Id_key" ON "Emissions"("scope2Id");
CREATE UNIQUE INDEX "Emissions_scope3Id_key" ON "Emissions"("scope3Id");
CREATE UNIQUE INDEX "Emissions_biogenicEmissionsId_key" ON "Emissions"("biogenicEmissionsId");
CREATE UNIQUE INDEX "Emissions_scope1And2Id_key" ON "Emissions"("scope1And2Id");
CREATE UNIQUE INDEX "Emissions_statedTotalEmissionsId_key" ON "Emissions"("statedTotalEmissionsId");
CREATE TABLE "new_Scope1And2" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "total" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "Scope1And2_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Scope1And2" ("id", "metadataId", "total", "unit") SELECT "id", "metadataId", "total", "unit" FROM "Scope1And2";
DROP TABLE "Scope1And2";
ALTER TABLE "new_Scope1And2" RENAME TO "Scope1And2";
CREATE TABLE "new_StatedTotalEmissions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "total" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "metadataId" INTEGER NOT NULL,
    "scope3Id" INTEGER,
    CONSTRAINT "StatedTotalEmissions_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StatedTotalEmissions_scope3Id_fkey" FOREIGN KEY ("scope3Id") REFERENCES "Scope3" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_StatedTotalEmissions" ("id", "metadataId", "scope3Id", "total", "unit") SELECT "id", "metadataId", "scope3Id", "total", "unit" FROM "StatedTotalEmissions";
DROP TABLE "StatedTotalEmissions";
ALTER TABLE "new_StatedTotalEmissions" RENAME TO "StatedTotalEmissions";
CREATE UNIQUE INDEX "StatedTotalEmissions_scope3Id_key" ON "StatedTotalEmissions"("scope3Id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
