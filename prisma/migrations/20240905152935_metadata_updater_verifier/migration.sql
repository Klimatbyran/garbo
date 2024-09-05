/*
  Warnings:

  - You are about to drop the column `userId` on the `Metadata` table. All the data in the column will be lost.
  - Added the required column `updaterId` to the `Metadata` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Metadata" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "comment" TEXT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updaterId" INTEGER NOT NULL,
    "verifierId" INTEGER,
    "sourceId" INTEGER NOT NULL,
    CONSTRAINT "Metadata_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Metadata_updaterId_fkey" FOREIGN KEY ("updaterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Metadata_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Metadata" ("comment", "id", "sourceId", "updatedAt") SELECT "comment", "id", "sourceId", "updatedAt" FROM "Metadata";
DROP TABLE "Metadata";
ALTER TABLE "new_Metadata" RENAME TO "Metadata";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
