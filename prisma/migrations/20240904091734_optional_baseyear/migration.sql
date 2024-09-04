-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Goal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "description" TEXT NOT NULL,
    "year" TEXT,
    "target" REAL,
    "baseYear" TEXT,
    "metadataId" INTEGER NOT NULL,
    "companyId" TEXT NOT NULL,
    "reportingPeriodId" INTEGER,
    CONSTRAINT "Goal_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "metadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Goal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("wikidataId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Goal_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Goal" ("baseYear", "companyId", "description", "id", "metadataId", "reportingPeriodId", "target", "year") SELECT "baseYear", "companyId", "description", "id", "metadataId", "reportingPeriodId", "target", "year" FROM "Goal";
DROP TABLE "Goal";
ALTER TABLE "new_Goal" RENAME TO "Goal";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
