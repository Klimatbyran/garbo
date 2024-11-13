/*
  Warnings:

  - You are about to drop the column `reportingPeriodId` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the column `reportingPeriodId` on the `Initiative` table. All the data in the column will be lost.
  - The primary key for the `ReportingPeriod` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `ReportingPeriod` table. All the data in the column will be lost.
  - Added the required column `year` to the `ReportingPeriod` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_reportingPeriodId_fkey";

-- DropForeignKey
ALTER TABLE "Initiative" DROP CONSTRAINT "Initiative_reportingPeriodId_fkey";

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

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_companyId_year_fkey" FOREIGN KEY ("companyId", "year") REFERENCES "ReportingPeriod"("companyId", "year") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_companyId_year_fkey" FOREIGN KEY ("companyId", "year") REFERENCES "ReportingPeriod"("companyId", "year") ON DELETE RESTRICT ON UPDATE CASCADE;
