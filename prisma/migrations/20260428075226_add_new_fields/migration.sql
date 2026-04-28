/*
  Warnings:

  - Added the required column `wikidataId` to the `ReportRunJob` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ReportRunJob" ADD COLUMN     "approved_timestamp" TEXT,
ADD COLUMN     "wikidataId" TEXT NOT NULL;
