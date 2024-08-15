-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FiscalYear" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startYear" INTEGER NOT NULL,
    "startMonth" TEXT,
    "endYear" INTEGER,
    "companyId" INTEGER NOT NULL,
    "emissionsId" INTEGER NOT NULL,
    CONSTRAINT "FiscalYear_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FiscalYear" ("companyId", "startYear", "emissionsId", "id") SELECT "companyId", "year", "emissionsId", "id" FROM "FiscalYear";
DROP TABLE "FiscalYear";
ALTER TABLE "new_FiscalYear" RENAME TO "FiscalYear";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
