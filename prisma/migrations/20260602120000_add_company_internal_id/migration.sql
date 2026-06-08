/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `Company` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Company" ADD COLUMN "id" TEXT;

-- Backfill existing rows (PostgreSQL gen_random_uuid)
UPDATE "Company" SET "id" = gen_random_uuid()::text WHERE "id" IS NULL;

-- AlterTable
ALTER TABLE "Company" ALTER COLUMN "id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Company_id_key" ON "Company"("id");
