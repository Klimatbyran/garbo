-- CreateEnum
CREATE TYPE "Scope3CategoryReporting" AS ENUM ('FULL', 'GROUPED', 'CUSTOM_LABELS', 'SINGLE_TOTAL');

-- AlterTable
ALTER TABLE "ReportingQuality"
    DROP COLUMN "usesGhgProtocolCategories",
    ADD COLUMN "usesGhgProtocolCategories" "Scope3CategoryReporting",
    ADD COLUMN "categoryLabelsExample" TEXT,
    ADD COLUMN "missingScopesReason" TEXT,
    ADD COLUMN "scope2MethodExplicit" BOOLEAN;
