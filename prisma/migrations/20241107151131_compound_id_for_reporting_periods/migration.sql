/*
  Warnings:

  - The primary key for the `ReportingPeriod` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `ReportingPeriod` table. All the data in the column will be lost.
  - Added the required column `year` to the `ReportingPeriod` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Goal" DROP COLUMN "reportingPeriodId";

-- AlterTable
ALTER TABLE "Initiative" DROP COLUMN "reportingPeriodId";

-- AlterTable
ALTER TABLE "ReportingPeriod" ADD COLUMN "year" TEXT;
UPDATE "ReportingPeriod" SET "year" = DATE_PART('year', "endDate"::date);
ALTER TABLE "ReportingPeriod" ALTER COLUMN "year" SET NOT NULL;

ALTER TABLE "ReportingPeriod" DROP CONSTRAINT "ReportingPeriod_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "ReportingPeriod_pkey" PRIMARY KEY ("companyId", "year");
