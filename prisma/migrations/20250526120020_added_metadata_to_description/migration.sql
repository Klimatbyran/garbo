-- AlterTable
ALTER TABLE "Metadata" ADD COLUMN     "descriptionId" TEXT;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_descriptionId_fkey" FOREIGN KEY ("descriptionId") REFERENCES "Description"("id") ON DELETE CASCADE ON UPDATE CASCADE;
