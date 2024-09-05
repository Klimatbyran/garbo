/*
  Warnings:

  - You are about to drop the column `unit` on the `Economy` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Currency" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Economy" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "turnover" REAL,
    "currencyId" INTEGER,
    "employees" REAL,
    "employeesUnit" TEXT,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "Economy_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Economy_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Economy" ("employees", "id", "metadataId", "turnover") SELECT "employees", "id", "metadataId", "turnover" FROM "Economy";
DROP TABLE "Economy";
ALTER TABLE "new_Economy" RENAME TO "Economy";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Currency_name_key" ON "Currency"("name");
