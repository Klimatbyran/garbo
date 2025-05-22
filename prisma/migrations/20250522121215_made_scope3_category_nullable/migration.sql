/*
  Warnings:

  - Made the column `total` on table `Scope3Category` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Scope3Category" ALTER COLUMN "total" SET NOT NULL;
