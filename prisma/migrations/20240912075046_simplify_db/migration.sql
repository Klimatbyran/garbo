/*
  Warnings:

  - You are about to drop the `Currency` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DataOrigin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `currencyId` on the `Turnover` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Currency_name_key";

-- DropIndex
DROP INDEX "DataOrigin_metadataId_key";

-- AlterTable
ALTER TABLE "Metadata" ADD COLUMN "dataOrigin" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Currency";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DataOrigin";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Turnover" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" REAL,
    "currency" TEXT,
    "economyId" INTEGER NOT NULL,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "Turnover_economyId_fkey" FOREIGN KEY ("economyId") REFERENCES "Economy" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Turnover_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Turnover" ("economyId", "id", "metadataId", "value") SELECT "economyId", "id", "metadataId", "value" FROM "Turnover";
DROP TABLE "Turnover";
ALTER TABLE "new_Turnover" RENAME TO "Turnover";
CREATE UNIQUE INDEX "Turnover_economyId_key" ON "Turnover"("economyId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
