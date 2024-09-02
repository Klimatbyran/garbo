/*
  Warnings:

  - Added the required column `subIndustryDescription` to the `IndustryGics` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Scope2" ADD COLUMN "value" REAL;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_IndustryGics" (
    "sectorCode" TEXT NOT NULL,
    "sectorName" TEXT NOT NULL,
    "groupCode" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "industryCode" TEXT NOT NULL,
    "industryName" TEXT NOT NULL,
    "subIndustryCode" TEXT NOT NULL PRIMARY KEY,
    "subIndustryName" TEXT NOT NULL,
    "subIndustryDescription" TEXT NOT NULL
);
INSERT INTO "new_IndustryGics" ("groupCode", "groupName", "industryCode", "industryName", "sectorCode", "sectorName", "subIndustryCode", "subIndustryName") SELECT "groupCode", "groupName", "industryCode", "industryName", "sectorCode", "sectorName", "subIndustryCode", "subIndustryName" FROM "IndustryGics";
DROP TABLE "IndustryGics";
ALTER TABLE "new_IndustryGics" RENAME TO "IndustryGics";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
