-- CreateEnum
CREATE TYPE "CompanyIdentifierType" AS ENUM ('WIKIDATA', 'LEI', 'ORG_NUMBER', 'ISIN');

-- CreateTable
CREATE TABLE "company_identifiers" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "CompanyIdentifierType" NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "company_identifiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_identifiers_companyId_type_key" ON "company_identifiers"("companyId", "type");

-- CreateIndex
CREATE INDEX "company_identifiers_type_value_idx" ON "company_identifiers"("type", "value");

-- AddForeignKey
ALTER TABLE "company_identifiers" ADD CONSTRAINT "company_identifiers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Metadata" ADD COLUMN "companyIdentifierId" TEXT;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_companyIdentifierId_fkey" FOREIGN KEY ("companyIdentifierId") REFERENCES "company_identifiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
