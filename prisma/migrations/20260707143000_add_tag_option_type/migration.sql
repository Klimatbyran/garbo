-- CreateEnum
CREATE TYPE "TagOptionType" AS ENUM ('COUNTRY', 'REGION', 'OWNERSHIP', 'MARKET_CAP', 'INDEX', 'OTHER');

-- AlterTable
ALTER TABLE "tag_options" ADD COLUMN "type" "TagOptionType" NOT NULL DEFAULT 'OTHER';

-- Backfill known slugs
UPDATE "tag_options" SET "type" = 'COUNTRY' WHERE "slug" IN ('sweden', 'norway', 'finland', 'denmark', 'iceland');
UPDATE "tag_options" SET "type" = 'REGION' WHERE "slug" = 'baltics';
UPDATE "tag_options" SET "type" = 'OWNERSHIP' WHERE "slug" IN ('public', 'private', 'state-owned', 'municipality-owned');
UPDATE "tag_options" SET "type" = 'MARKET_CAP' WHERE "slug" IN ('large-cap', 'mid-cap', 'small-cap');
