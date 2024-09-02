/*
  Warnings:

  - You are about to drop the column `groupName` on the `IndustryGics` table. All the data in the column will be lost.
  - You are about to drop the column `industryName` on the `IndustryGics` table. All the data in the column will be lost.
  - You are about to drop the column `sectorName` on the `IndustryGics` table. All the data in the column will be lost.
  - You are about to drop the column `subIndustryDescription` on the `IndustryGics` table. All the data in the column will be lost.
  - You are about to drop the column `subIndustryName` on the `IndustryGics` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_IndustryGics" (
    "sectorCode" TEXT NOT NULL,
    "groupCode" TEXT NOT NULL,
    "industryCode" TEXT NOT NULL,
    "subIndustryCode" TEXT NOT NULL PRIMARY KEY
);
INSERT INTO "new_IndustryGics" ("groupCode", "industryCode", "sectorCode", "subIndustryCode") SELECT "groupCode", "industryCode", "sectorCode", "subIndustryCode" FROM "IndustryGics";
DROP TABLE "IndustryGics";
ALTER TABLE "new_IndustryGics" RENAME TO "IndustryGics";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
