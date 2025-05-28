/*
  Warnings:

  - You are about to drop the column `companyWikidataId` on the `Description` table. All the data in the column will be lost.
  - Added the required column `companyId` to the `Description` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Description" DROP CONSTRAINT "Description_companyWikidataId_fkey";

-- DropIndex
DROP INDEX "Description_companyWikidataId_key";

-- AlterTable
ALTER TABLE "Description" DROP COLUMN "companyWikidataId",
ADD COLUMN     "companyId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Description" ADD CONSTRAINT "Description_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("wikidataId") ON DELETE CASCADE ON UPDATE CASCADE;
