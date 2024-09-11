/*
  Warnings:

  - You are about to drop the column `updaterId` on the `Metadata` table. All the data in the column will be lost.
  - You are about to drop the column `verifierId` on the `Metadata` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Metadata` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Metadata" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "comment" TEXT,
    "source" TEXT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "verifiedByUserId" INTEGER,
    CONSTRAINT "Metadata_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Metadata_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Metadata" ("comment", "id", "source", "updatedAt") SELECT "comment", "id", "source", "updatedAt" FROM "Metadata";
DROP TABLE "Metadata";
ALTER TABLE "new_Metadata" RENAME TO "Metadata";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
