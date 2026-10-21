-- AlterEnum: add BIC
ALTER TYPE "CompanyIdentifierType" ADD VALUE 'BIC';

-- CreateEnum
CREATE TYPE "CompanyIdentifierRole" AS ENUM ('PRIMARY');

-- AlterTable
ALTER TABLE "company_identifiers" ADD COLUMN "role" "CompanyIdentifierRole";

-- Drop old one-per-type uniqueness; allow multiple ISIN/BIC rows per company.
DROP INDEX IF EXISTS "company_identifiers_companyId_type_key";

-- Same value twice on one company is still invalid.
CREATE UNIQUE INDEX "company_identifiers_companyId_type_value_key"
  ON "company_identifiers"("companyId", "type", "value");

CREATE INDEX "company_identifiers_companyId_type_idx"
  ON "company_identifiers"("companyId", "type");

-- At most one PRIMARY per (company, type).
CREATE UNIQUE INDEX "company_identifiers_companyId_type_primary_key"
  ON "company_identifiers"("companyId", "type")
  WHERE "role" = 'PRIMARY';
