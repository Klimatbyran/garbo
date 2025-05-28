/*
  Warnings:

  - Changed the type of `language` on the `Description` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Language" AS ENUM ('SWE', 'ENG');

-- AlterTable
ALTER TABLE "Description" DROP COLUMN "language",
ADD COLUMN     "language" "Language" NOT NULL;
