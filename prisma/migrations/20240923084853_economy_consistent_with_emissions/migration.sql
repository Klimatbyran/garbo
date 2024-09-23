/*
  Warnings:

  - You are about to drop the column `metadataId` on the `Economy` table. All the data in the column will be lost.
  - You are about to drop the column `economyId` on the `Employees` table. All the data in the column will be lost.
  - You are about to drop the column `economyId` on the `Turnover` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Economy" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "turnoverId" INTEGER,
    "employeesId" INTEGER,
    CONSTRAINT "Economy_turnoverId_fkey" FOREIGN KEY ("turnoverId") REFERENCES "Turnover" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Economy_employeesId_fkey" FOREIGN KEY ("employeesId") REFERENCES "Employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Economy" ("id") SELECT "id" FROM "Economy";
DROP TABLE "Economy";
ALTER TABLE "new_Economy" RENAME TO "Economy";
CREATE UNIQUE INDEX "Economy_turnoverId_key" ON "Economy"("turnoverId");
CREATE UNIQUE INDEX "Economy_employeesId_key" ON "Economy"("employeesId");
CREATE TABLE "new_Employees" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" REAL,
    "unit" TEXT,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "Employees_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Employees" ("id", "metadataId", "unit", "value") SELECT "id", "metadataId", "unit", "value" FROM "Employees";
DROP TABLE "Employees";
ALTER TABLE "new_Employees" RENAME TO "Employees";
CREATE TABLE "new_Turnover" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" REAL,
    "currency" TEXT,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "Turnover_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Turnover" ("currency", "id", "metadataId", "value") SELECT "currency", "id", "metadataId", "value" FROM "Turnover";
DROP TABLE "Turnover";
ALTER TABLE "new_Turnover" RENAME TO "Turnover";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
