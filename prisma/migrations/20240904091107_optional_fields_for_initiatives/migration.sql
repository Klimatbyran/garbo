-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Initiative" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "year" TEXT,
    "scope" TEXT,
    "companyId" TEXT NOT NULL,
    "metadataId" INTEGER NOT NULL,
    "reportingPeriodId" INTEGER,
    CONSTRAINT "Initiative_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("wikidataId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Initiative_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Initiative_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Initiative" ("companyId", "description", "id", "metadataId", "reportingPeriodId", "scope", "title", "year") SELECT "companyId", "description", "id", "metadataId", "reportingPeriodId", "scope", "title", "year" FROM "Initiative";
DROP TABLE "Initiative";
ALTER TABLE "new_Initiative" RENAME TO "Initiative";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
