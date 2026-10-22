-- AlterEnum: add BIC
ALTER TYPE "CompanyIdentifierType" ADD VALUE 'BIC';

-- CreateEnum
CREATE TYPE "CompanyIdentifierRole" AS ENUM ('PRIMARY');

-- AlterTable
ALTER TABLE "company_identifiers" ADD COLUMN "role" "CompanyIdentifierRole";

-- Normalize LEI/ISIN/BIC casing before uniqueness changes.
UPDATE "company_identifiers"
SET "value" = upper("value")
WHERE "type" IN ('LEI', 'ISIN', 'BIC')
  AND "value" <> upper("value");

-- Canonicalize 8-char BICs to 11-char XXX (primary office) form.
UPDATE "company_identifiers"
SET "value" = "value" || 'XXX'
WHERE "type" = 'BIC'
  AND length("value") = 8;

-- Drop old one-per-type uniqueness; allow multiple ISIN/BIC rows per company.
DROP INDEX IF EXISTS "company_identifiers_companyId_type_key";

-- Deduplicate any accidental singular-type duplicates before re-adding a guard.
DELETE FROM "company_identifiers" a
USING "company_identifiers" b
WHERE a."type" IN ('WIKIDATA', 'LEI', 'ORG_NUMBER')
  AND a."companyId" = b."companyId"
  AND a."type" = b."type"
  AND a."id" > b."id";

-- Deduplicate case/canonical collisions on (companyId, type, value).
DELETE FROM "company_identifiers" a
USING "company_identifiers" b
WHERE a."companyId" = b."companyId"
  AND a."type" = b."type"
  AND a."value" = b."value"
  AND a."id" > b."id";

-- Same value twice on one company is still invalid.
CREATE UNIQUE INDEX "company_identifiers_companyId_type_value_key"
  ON "company_identifiers"("companyId", "type", "value");

CREATE INDEX "company_identifiers_companyId_type_idx"
  ON "company_identifiers"("companyId", "type");

-- Singular types remain one-per-company at the DB layer.
CREATE UNIQUE INDEX "company_identifiers_companyId_type_singular_key"
  ON "company_identifiers"("companyId", "type")
  WHERE "type" IN ('WIKIDATA', 'LEI', 'ORG_NUMBER');

-- At most one PRIMARY per (company, type).
CREATE UNIQUE INDEX "company_identifiers_companyId_type_primary_key"
  ON "company_identifiers"("companyId", "type")
  WHERE "role" = 'PRIMARY';
