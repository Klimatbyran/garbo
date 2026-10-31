CREATE TYPE "CompanyIdentifierRole" AS ENUM ('PRIMARY');
ALTER TABLE "company_identifiers" ADD COLUMN "role" "CompanyIdentifierRole";
UPDATE "company_identifiers"
SET "value" = upper("value")
WHERE "type" IN ('LEI', 'ISIN', 'BIC')
  AND "value" <> upper("value");
UPDATE "company_identifiers"
SET "value" = "value" || 'XXX'
WHERE "type" = 'BIC'
  AND length("value") = 8;
DROP INDEX IF EXISTS "company_identifiers_companyId_type_key";
DELETE FROM "company_identifiers" a
USING "company_identifiers" b
WHERE a."type" IN ('WIKIDATA', 'LEI', 'ORG_NUMBER')
  AND a."companyId" = b."companyId"
  AND a."type" = b."type"
  AND a."id" > b."id";
DELETE FROM "company_identifiers" a
USING "company_identifiers" b
WHERE a."companyId" = b."companyId"
  AND a."type" = b."type"
  AND a."value" = b."value"
  AND a."id" > b."id";
CREATE UNIQUE INDEX "company_identifiers_companyId_type_value_key"
  ON "company_identifiers"("companyId", "type", "value");
CREATE INDEX "company_identifiers_companyId_type_idx"
  ON "company_identifiers"("companyId", "type");
CREATE UNIQUE INDEX "company_identifiers_companyId_type_singular_key"
  ON "company_identifiers"("companyId", "type")
  WHERE "type" IN ('WIKIDATA', 'LEI', 'ORG_NUMBER');
CREATE UNIQUE INDEX "company_identifiers_companyId_type_primary_key"
  ON "company_identifiers"("companyId", "type")
  WHERE "role" = 'PRIMARY';
