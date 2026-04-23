/*
  Warnings:

  - A unique constraint covering the columns `[threadId]` on the table `ReportRun` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `threadId` to the `ReportRun` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ReportRun_pdfUrl_key";

-- AlterTable
ALTER TABLE "ReportRun" ADD COLUMN     "threadId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ReportRun_threadId_key" ON "ReportRun"("threadId");

-- CreateIndex
CREATE INDEX "ReportRun_pdfUrl_idx" ON "ReportRun"("pdfUrl");
