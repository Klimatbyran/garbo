/*
  Warnings:

  - You are about to drop the column `scope` on the `BaseYear` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[companyId]` on the table `BaseYear` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "BaseYear" DROP COLUMN "scope";

-- CreateIndex
CREATE UNIQUE INDEX "BaseYear_companyId_key" ON "BaseYear"("companyId");
