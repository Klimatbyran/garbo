-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Scope1And2" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "total" REAL,
    "metadataId" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    CONSTRAINT "Scope1And2_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Scope1And2" ("id", "metadataId", "total", "unit") SELECT "id", "metadataId", "total", "unit" FROM "Scope1And2";
DROP TABLE "Scope1And2";
ALTER TABLE "new_Scope1And2" RENAME TO "Scope1And2";
CREATE TABLE "new_StatedTotalEmissions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "total" REAL,
    "metadataId" INTEGER NOT NULL,
    "scope3Id" INTEGER,
    "unit" TEXT NOT NULL,
    CONSTRAINT "StatedTotalEmissions_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StatedTotalEmissions_scope3Id_fkey" FOREIGN KEY ("scope3Id") REFERENCES "Scope3" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_StatedTotalEmissions" ("id", "metadataId", "scope3Id", "total", "unit") SELECT "id", "metadataId", "scope3Id", "total", "unit" FROM "StatedTotalEmissions";
DROP TABLE "StatedTotalEmissions";
ALTER TABLE "new_StatedTotalEmissions" RENAME TO "StatedTotalEmissions";
CREATE UNIQUE INDEX "StatedTotalEmissions_scope3Id_key" ON "StatedTotalEmissions"("scope3Id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
