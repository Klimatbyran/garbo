/*
  Warnings:

  - You are about to drop the `Source` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `sourceId` on the `Economy` table. All the data in the column will be lost.
  - You are about to drop the column `sourceId` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the column `sourceId` on the `Initiative` table. All the data in the column will be lost.
  - You are about to drop the column `sourceId` on the `Scope1` table. All the data in the column will be lost.
  - You are about to drop the column `sourceId` on the `Scope2` table. All the data in the column will be lost.
  - You are about to drop the column `sourceId` on the `Scope3Category` table. All the data in the column will be lost.
  - Added the required column `metadataId` to the `Economy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `metadataId` to the `Goal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `metadataId` to the `Initiative` table without a default value. This is not possible if the table is not empty.
  - Added the required column `metadataId` to the `Scope1` table without a default value. This is not possible if the table is not empty.
  - Added the required column `metadataId` to the `Scope2` table without a default value. This is not possible if the table is not empty.
  - Added the required column `metadataId` to the `Scope3Category` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Source";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "metadata" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT,
    "comment" TEXT,
    "userId" INTEGER NOT NULL,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Economy" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "turnover" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "employees" INTEGER NOT NULL,
    "metadataId" INTEGER NOT NULL,
    "fiscalYearId" INTEGER NOT NULL,
    CONSTRAINT "Economy_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Economy_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Economy" ("employees", "fiscalYearId", "id", "turnover", "unit") SELECT "employees", "fiscalYearId", "id", "turnover", "unit" FROM "Economy";
DROP TABLE "Economy";
ALTER TABLE "new_Economy" RENAME TO "Economy";
CREATE UNIQUE INDEX "Economy_fiscalYearId_key" ON "Economy"("fiscalYearId");
CREATE TABLE "new_Goal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "description" TEXT NOT NULL,
    "year" TEXT,
    "target" REAL,
    "baseYear" TEXT NOT NULL,
    "metadataId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    CONSTRAINT "Goal_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Goal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Goal" ("baseYear", "companyId", "description", "id", "target", "year") SELECT "baseYear", "companyId", "description", "id", "target", "year" FROM "Goal";
DROP TABLE "Goal";
ALTER TABLE "new_Goal" RENAME TO "Goal";
CREATE TABLE "new_Initiative" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "year" TEXT,
    "scope" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "Initiative_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Initiative_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Initiative" ("companyId", "description", "id", "scope", "title", "year") SELECT "companyId", "description", "id", "scope", "title", "year" FROM "Initiative";
DROP TABLE "Initiative";
ALTER TABLE "new_Initiative" RENAME TO "Initiative";
CREATE TABLE "new_Scope1" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" REAL NOT NULL,
    "biogenic" REAL,
    "unit" TEXT NOT NULL,
    "baseYear" TEXT NOT NULL,
    "metadataId" INTEGER NOT NULL,
    "emissionsId" INTEGER NOT NULL,
    CONSTRAINT "Scope1_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Scope1_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Scope1" ("baseYear", "biogenic", "emissionsId", "id", "unit", "value") SELECT "baseYear", "biogenic", "emissionsId", "id", "unit", "value" FROM "Scope1";
DROP TABLE "Scope1";
ALTER TABLE "new_Scope1" RENAME TO "Scope1";
CREATE UNIQUE INDEX "Scope1_emissionsId_key" ON "Scope1"("emissionsId");
CREATE TABLE "new_Scope2" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" REAL NOT NULL,
    "biogenic" REAL,
    "unit" TEXT NOT NULL,
    "mb" REAL,
    "lb" REAL,
    "baseYear" TEXT NOT NULL,
    "metadataId" INTEGER NOT NULL,
    "emissionsId" INTEGER NOT NULL,
    CONSTRAINT "Scope2_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Scope2_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Scope2" ("baseYear", "biogenic", "emissionsId", "id", "lb", "mb", "unit", "value") SELECT "baseYear", "biogenic", "emissionsId", "id", "lb", "mb", "unit", "value" FROM "Scope2";
DROP TABLE "Scope2";
ALTER TABLE "new_Scope2" RENAME TO "Scope2";
CREATE UNIQUE INDEX "Scope2_emissionsId_key" ON "Scope2"("emissionsId");
CREATE TABLE "new_Scope3" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" REAL,
    "biogenic" REAL,
    "unit" TEXT NOT NULL,
    "baseYear" TEXT NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "emissionsId" INTEGER NOT NULL,
    CONSTRAINT "Scope3_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Scope3_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Scope3" ("baseYear", "biogenic", "emissionsId", "id", "sourceId", "unit", "value") SELECT "baseYear", "biogenic", "emissionsId", "id", "sourceId", "unit", "value" FROM "Scope3";
DROP TABLE "Scope3";
ALTER TABLE "new_Scope3" RENAME TO "Scope3";
CREATE UNIQUE INDEX "Scope3_emissionsId_key" ON "Scope3"("emissionsId");
CREATE TABLE "new_Scope3Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" INTEGER NOT NULL,
    "value" REAL,
    "scope3Id" INTEGER NOT NULL,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "Scope3Category_scope3Id_fkey" FOREIGN KEY ("scope3Id") REFERENCES "Scope3" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Scope3Category_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Scope3Category" ("category", "id", "scope3Id", "value") SELECT "category", "id", "scope3Id", "value" FROM "Scope3Category";
DROP TABLE "Scope3Category";
ALTER TABLE "new_Scope3Category" RENAME TO "Scope3Category";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
