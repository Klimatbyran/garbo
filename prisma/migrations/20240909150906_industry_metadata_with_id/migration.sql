/*
  Warnings:

  - The primary key for the `Industry` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `id` to the `Industry` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Industry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gicsSubIndustryCode" TEXT NOT NULL,
    "metadataId" INTEGER NOT NULL,
    "companyWikidataId" TEXT NOT NULL,
    CONSTRAINT "Industry_companyWikidataId_fkey" FOREIGN KEY ("companyWikidataId") REFERENCES "Company" ("wikidataId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Industry_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Industry_gicsSubIndustryCode_fkey" FOREIGN KEY ("gicsSubIndustryCode") REFERENCES "IndustryGics" ("subIndustryCode") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Industry" ("companyWikidataId", "gicsSubIndustryCode", "metadataId") SELECT "companyWikidataId", "gicsSubIndustryCode", "metadataId" FROM "Industry";
DROP TABLE "Industry";
ALTER TABLE "new_Industry" RENAME TO "Industry";
CREATE UNIQUE INDEX "Industry_companyWikidataId_key" ON "Industry"("companyWikidataId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
