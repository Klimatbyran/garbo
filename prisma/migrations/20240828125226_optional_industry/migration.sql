-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Company" (
    "wikidataId" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "industryGicsCode" TEXT,
    CONSTRAINT "Company_industryGicsCode_fkey" FOREIGN KEY ("industryGicsCode") REFERENCES "IndustryGics" ("subIndustryCode") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Company" ("description", "industryGicsCode", "name", "url", "wikidataId") SELECT "description", "industryGicsCode", "name", "url", "wikidataId" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
