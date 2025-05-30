/*
  Warnings:

  - You are about to drop the column `description` on the `Company` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Company" DROP COLUMN "description";

-- CreateTable
CREATE TABLE "Description" (
    "id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "companyWikidataId" TEXT NOT NULL,

    CONSTRAINT "Description_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Description_companyWikidataId_key" ON "Description"("companyWikidataId");

-- AddForeignKey
ALTER TABLE "Description" ADD CONSTRAINT "Description_companyWikidataId_fkey" FOREIGN KEY ("companyWikidataId") REFERENCES "Company"("wikidataId") ON DELETE CASCADE ON UPDATE CASCADE;
