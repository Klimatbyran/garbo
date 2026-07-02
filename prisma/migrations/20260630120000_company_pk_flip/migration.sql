-- Phase 2: flip Company primary key from wikidataId to id; repoint child FKs to Company.id

-- Drop foreign keys referencing Company(wikidataId)
ALTER TABLE "BaseYear" DROP CONSTRAINT IF EXISTS "BaseYear_companyId_fkey";
ALTER TABLE "Industry" DROP CONSTRAINT IF EXISTS "Industry_companyWikidataId_fkey";
ALTER TABLE "ReportingPeriod" DROP CONSTRAINT IF EXISTS "ReportingPeriod_companyId_fkey";
ALTER TABLE "Goal" DROP CONSTRAINT IF EXISTS "Goal_companyId_fkey";
ALTER TABLE "Initiative" DROP CONSTRAINT IF EXISTS "Initiative_companyId_fkey";
ALTER TABLE "Description" DROP CONSTRAINT IF EXISTS "Description_companyId_fkey";
ALTER TABLE "CompanyReport" DROP CONSTRAINT IF EXISTS "CompanyReport_companyId_fkey";

-- Repoint child companyId values from wikidataId to internal Company.id
UPDATE "BaseYear" AS child
SET "companyId" = company."id"
FROM "Company" AS company
WHERE child."companyId" = company."wikidataId";

UPDATE "ReportingPeriod" AS child
SET "companyId" = company."id"
FROM "Company" AS company
WHERE child."companyId" = company."wikidataId";

UPDATE "Goal" AS child
SET "companyId" = company."id"
FROM "Company" AS company
WHERE child."companyId" = company."wikidataId";

UPDATE "Initiative" AS child
SET "companyId" = company."id"
FROM "Company" AS company
WHERE child."companyId" = company."wikidataId";

UPDATE "Description" AS child
SET "companyId" = company."id"
FROM "Company" AS company
WHERE child."companyId" = company."wikidataId";

UPDATE "CompanyReport" AS child
SET "companyId" = company."id"
FROM "Company" AS company
WHERE child."companyId" = company."wikidataId";

-- Industry: rename companyWikidataId -> companyId
ALTER TABLE "Industry" ADD COLUMN "companyId" TEXT;
UPDATE "Industry" AS industry
SET "companyId" = company."id"
FROM "Company" AS company
WHERE industry."companyWikidataId" = company."wikidataId";
ALTER TABLE "Industry" ALTER COLUMN "companyId" SET NOT NULL;
DROP INDEX IF EXISTS "Industry_companyWikidataId_key";
ALTER TABLE "Industry" DROP COLUMN "companyWikidataId";
CREATE UNIQUE INDEX "Industry_companyId_key" ON "Industry"("companyId");

-- Flip Company primary key
ALTER TABLE "Company" DROP CONSTRAINT "Company_pkey";
DROP INDEX IF EXISTS "Company_id_key";
ALTER TABLE "Company" ADD CONSTRAINT "Company_pkey" PRIMARY KEY ("id");
ALTER TABLE "Company" ALTER COLUMN "wikidataId" DROP NOT NULL;
CREATE UNIQUE INDEX "Company_wikidataId_key" ON "Company"("wikidataId");

-- Recreate foreign keys referencing Company(id)
ALTER TABLE "BaseYear"
  ADD CONSTRAINT "BaseYear_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Industry"
  ADD CONSTRAINT "Industry_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReportingPeriod"
  ADD CONSTRAINT "ReportingPeriod_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Goal"
  ADD CONSTRAINT "Goal_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Initiative"
  ADD CONSTRAINT "Initiative_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Description"
  ADD CONSTRAINT "Description_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CompanyReport"
  ADD CONSTRAINT "CompanyReport_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
