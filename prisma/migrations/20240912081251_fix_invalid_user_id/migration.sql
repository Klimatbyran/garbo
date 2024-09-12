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
    "dataOrigin" TEXT,
    CONSTRAINT "Metadata_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Metadata_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Metadata" ("comment", "dataOrigin", "id", "source", "updatedAt", "userId", "verifiedByUserId") SELECT "comment", "dataOrigin", "id", "source", "updatedAt", "userId", "verifiedByUserId" FROM "Metadata";
DROP TABLE "Metadata";
ALTER TABLE "new_Metadata" RENAME TO "Metadata";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
