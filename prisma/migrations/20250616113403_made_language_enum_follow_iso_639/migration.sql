/*
  Warnings:

  - The values [SWE,ENG] on the enum `Language` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Language_new" AS ENUM ('SV', 'EN');
ALTER TABLE "Description" ALTER COLUMN "language" TYPE "Language_new" USING ("language"::text::"Language_new");
ALTER TYPE "Language" RENAME TO "Language_old";
ALTER TYPE "Language_new" RENAME TO "Language";
DROP TYPE "Language_old";
COMMIT;
