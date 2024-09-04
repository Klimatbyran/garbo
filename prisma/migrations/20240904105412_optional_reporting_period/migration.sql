/*
  Warnings:

  - You are about to drop the column `reportingPeriodId` on the `Economy` table. All the data in the column will be lost.
  - You are about to drop the column `reportingPeriodId` on the `Emissions` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Economy" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "turnover" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "employees" INTEGER NOT NULL,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "Economy_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Economy" ("employees", "id", "metadataId", "turnover", "unit") SELECT "employees", "id", "metadataId", "turnover", "unit" FROM "Economy";
DROP TABLE "Economy";
ALTER TABLE "new_Economy" RENAME TO "Economy";
CREATE TABLE "new_Emissions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "scope1Id" INTEGER NOT NULL,
    "scope2Id" INTEGER NOT NULL,
    "scope3Id" INTEGER NOT NULL,
    "biogenicEmissionsId" INTEGER,
    "scope1And2Id" INTEGER,
    "statedTotalEmissionsId" INTEGER,
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
CREATE TABLE "new_ReportingPeriod" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    "emissionsId" INTEGER,
    "economyId" INTEGER,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "ReportingPeriod_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReportingPeriod_economyId_fkey" FOREIGN KEY ("economyId") REFERENCES "Economy" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ReportingPeriod_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ReportingPeriod_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("wikidataId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ReportingPeriod" ("companyId", "emissionsId", "endDate", "id", "metadataId", "startDate") SELECT "companyId", "emissionsId", "endDate", "id", "metadataId", "startDate" FROM "ReportingPeriod";
DROP TABLE "ReportingPeriod";
ALTER TABLE "new_ReportingPeriod" RENAME TO "ReportingPeriod";
CREATE UNIQUE INDEX "ReportingPeriod_emissionsId_key" ON "ReportingPeriod"("emissionsId");
CREATE UNIQUE INDEX "ReportingPeriod_economyId_key" ON "ReportingPeriod"("economyId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
