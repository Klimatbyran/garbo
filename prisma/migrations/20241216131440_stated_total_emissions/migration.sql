/*
  Warnings:

  - You are about to drop the column `scope3Id` on the `StatedTotalEmissions` table. All the data in the column will be lost.

*/

-- TODO: We need to migrate the connection so the `scope3Id` column can be replaced with a connection to the right `StatedTotalEmissions`

-- DropForeignKey
ALTER TABLE "StatedTotalEmissions" DROP CONSTRAINT "StatedTotalEmissions_scope3Id_fkey";

-- DropIndex
DROP INDEX "StatedTotalEmissions_scope3Id_key";

-- AlterTable
ALTER TABLE "StatedTotalEmissions" DROP COLUMN "scope3Id";

-- AddForeignKey
ALTER TABLE "Scope3" ADD CONSTRAINT "Scope3_statedTotalEmissionsId_fkey" FOREIGN KEY ("statedTotalEmissionsId") REFERENCES "StatedTotalEmissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
