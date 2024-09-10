/*
  Warnings:

  - You are about to drop the column `employeesId` on the `Economy` table. All the data in the column will be lost.
  - You are about to drop the column `turnoverId` on the `Economy` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Economy" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "metadataId" INTEGER NOT NULL,
    CONSTRAINT "Economy_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Economy" ("id", "metadataId") SELECT "id", "metadataId" FROM "Economy";
DROP TABLE "Economy";
ALTER TABLE "new_Economy" RENAME TO "Economy";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
