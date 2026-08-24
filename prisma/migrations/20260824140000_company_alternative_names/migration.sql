-- AlterTable
ALTER TABLE "Company" ADD COLUMN "alternativeNames" TEXT[] DEFAULT ARRAY[]::TEXT[];
