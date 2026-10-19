-- CreateEnum
CREATE TYPE "GoalTargetType" AS ENUM ('ABSOLUTE', 'INTENSITY', 'NET_ZERO', 'CLIMATE_NEUTRAL', 'OTHER');

-- CreateEnum
CREATE TYPE "GoalHorizon" AS ENUM ('NEAR_TERM', 'LONG_TERM');

-- CreateEnum
CREATE TYPE "GoalTargetDirection" AS ENUM ('REDUCE_BY', 'REACH_LEVEL');

-- CreateEnum
CREATE TYPE "GoalBaseYearSource" AS ENUM ('STATED_FOR_GOAL', 'COMPANY_BASE_YEAR', 'REPORT_YEAR', 'NOT_STATED');

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN "originalQuote" TEXT,
ADD COLUMN "targetType" "GoalTargetType",
ADD COLUMN "targetDirection" "GoalTargetDirection",
ADD COLUMN "unit" TEXT,
ADD COLUMN "intensityMetric" TEXT,
ADD COLUMN "horizon" "GoalHorizon",
ADD COLUMN "isSbtiTarget" BOOLEAN,
ADD COLUMN "baseYearSource" "GoalBaseYearSource";
