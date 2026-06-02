/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `Company` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Company_id_key" ON "Company"("id");
