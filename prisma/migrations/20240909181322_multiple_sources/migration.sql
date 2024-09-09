/*
  Warnings:

  - You are about to drop the column `sourceId` on the `Metadata` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Source_id_key";

-- CreateTable
CREATE TABLE "_MetadataToSource" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_MetadataToSource_A_fkey" FOREIGN KEY ("A") REFERENCES "Metadata" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_MetadataToSource_B_fkey" FOREIGN KEY ("B") REFERENCES "Source" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Metadata" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "comment" TEXT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updaterId" INTEGER NOT NULL,
    "verifierId" INTEGER,
    CONSTRAINT "Metadata_updaterId_fkey" FOREIGN KEY ("updaterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Metadata_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Metadata" ("comment", "id", "updatedAt", "updaterId", "verifierId") SELECT "comment", "id", "updatedAt", "updaterId", "verifierId" FROM "Metadata";
DROP TABLE "Metadata";
ALTER TABLE "new_Metadata" RENAME TO "Metadata";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_MetadataToSource_AB_unique" ON "_MetadataToSource"("A", "B");

-- CreateIndex
CREATE INDEX "_MetadataToSource_B_index" ON "_MetadataToSource"("B");
