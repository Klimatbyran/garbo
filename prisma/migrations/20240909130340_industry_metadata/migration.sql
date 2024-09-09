/*
  Warnings:

  - You are about to drop the column `industryGicsCode` on the `Company` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Industry" (
    "gicsSubIndustryCode" TEXT NOT NULL PRIMARY KEY,
    "metadataId" INTEGER NOT NULL,
    "companyWikidataId" TEXT NOT NULL,
    CONSTRAINT "Industry_companyWikidataId_fkey" FOREIGN KEY ("companyWikidataId") REFERENCES "Company" ("wikidataId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Industry_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Industry_gicsSubIndustryCode_fkey" FOREIGN KEY ("gicsSubIndustryCode") REFERENCES "IndustryGics" ("subIndustryCode") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Company" (
    "wikidataId" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "internalComment" TEXT
);
INSERT INTO "new_Company" ("description", "name", "url", "wikidataId") SELECT "description", "name", "url", "wikidataId" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Industry_companyWikidataId_key" ON "Industry"("companyWikidataId");
