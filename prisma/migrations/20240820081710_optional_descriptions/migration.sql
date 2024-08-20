/*
  Warnings:

  - You are about to drop the column `name` on the `IndustryGics` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Company" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "wikidataId" TEXT,
    "url" TEXT,
    "industryGicsId" INTEGER,
    CONSTRAINT "Company_industryGicsId_fkey" FOREIGN KEY ("industryGicsId") REFERENCES "IndustryGics" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Company" ("description", "id", "industryGicsId", "name", "url", "wikidataId") SELECT "description", "id", "industryGicsId", "name", "url", "wikidataId" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");
CREATE TABLE "new_IndustryGics" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sectorCode" TEXT NOT NULL,
    "sectorName" TEXT NOT NULL,
    "groupCode" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "industryCode" TEXT NOT NULL,
    "industryName" TEXT NOT NULL,
    "subIndustryCode" TEXT NOT NULL,
    "subIndustryName" TEXT NOT NULL
);
INSERT INTO "new_IndustryGics" ("groupCode", "groupName", "id", "industryCode", "industryName", "sectorCode", "sectorName", "subIndustryCode", "subIndustryName") SELECT "groupCode", "groupName", "id", "industryCode", "industryName", "sectorCode", "sectorName", "subIndustryCode", "subIndustryName" FROM "IndustryGics";
DROP TABLE "IndustryGics";
ALTER TABLE "new_IndustryGics" RENAME TO "IndustryGics";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
