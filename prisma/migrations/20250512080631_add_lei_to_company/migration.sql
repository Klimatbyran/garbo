/*
  Warnings:

  - A unique constraint covering the columns `[lei]` on the table `Company` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "lei" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Company_lei_key" ON "Company"("lei");
