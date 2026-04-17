-- CreateEnum
CREATE TYPE "Language" AS ENUM ('SWE', 'ENG');

-- DropIndex
DROP INDEX "Company_lei_key";

-- AlterTable
ALTER TABLE "Metadata" ADD COLUMN     "descriptionId" TEXT;

-- CreateTable
CREATE TABLE "Description" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "language" "Language" NOT NULL,

    CONSTRAINT "Description_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Description_companyId_language_key" ON "Description"("companyId", "language");

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_descriptionId_fkey" FOREIGN KEY ("descriptionId") REFERENCES "Description"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Description" ADD CONSTRAINT "Description_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("wikidataId") ON DELETE CASCADE ON UPDATE CASCADE;
