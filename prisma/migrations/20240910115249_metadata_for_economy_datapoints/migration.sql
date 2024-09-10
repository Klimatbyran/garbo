/*
  Warnings:

  - You are about to drop the column `currencyId` on the `Economy` table. All the data in the column will be lost.
  - You are about to drop the column `employees` on the `Economy` table. All the data in the column will be lost.
  - You are about to drop the column `employeesUnit` on the `Economy` table. All the data in the column will be lost.
  - You are about to drop the column `turnover` on the `Economy` table. All the data in the column will be lost.
  - Added the required column `employeesId` to the `Economy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `turnoverId` to the `Economy` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Turnover" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" REAL,
    "currencyId" INTEGER,
    "economyId" INTEGER NOT NULL,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "Turnover_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Turnover_economyId_fkey" FOREIGN KEY ("economyId") REFERENCES "Economy" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Turnover_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Employees" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" REAL,
    "unit" TEXT,
    "economyId" INTEGER NOT NULL,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "Employees_economyId_fkey" FOREIGN KEY ("economyId") REFERENCES "Economy" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Employees_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Economy" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "turnoverId" INTEGER NOT NULL,
    "employeesId" INTEGER NOT NULL,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "Economy_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Economy" ("id", "metadataId") SELECT "id", "metadataId" FROM "Economy";
DROP TABLE "Economy";
ALTER TABLE "new_Economy" RENAME TO "Economy";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Turnover_economyId_key" ON "Turnover"("economyId");

-- CreateIndex
CREATE UNIQUE INDEX "Employees_economyId_key" ON "Employees"("economyId");
