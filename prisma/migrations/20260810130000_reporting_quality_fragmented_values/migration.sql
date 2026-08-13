-- CreateEnum
CREATE TYPE "FragmentedValuesReporting" AS ENUM ('NONE', 'PARTS_WITH_TOTAL', 'PARTS_ONLY_NO_TOTAL');

-- AlterTable
ALTER TABLE "ReportingQuality"
    ADD COLUMN "scope1FragmentedReporting" "FragmentedValuesReporting",
    ADD COLUMN "scope1FragmentedExample" TEXT,
    ADD COLUMN "scope2FragmentedReporting" "FragmentedValuesReporting",
    ADD COLUMN "scope2FragmentedExample" TEXT,
    ADD COLUMN "scope3CategoryFragmentation" JSONB NOT NULL DEFAULT '[]';
