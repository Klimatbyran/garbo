/*
  Warnings:

  - Made the column `id` on table `Company` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Company" ALTER COLUMN "id" SET NOT NULL;
