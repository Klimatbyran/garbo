-- DatapointNote moves from insert-only history to one row per datapoint (upsert).
-- Existing environments may already have duplicate notes per datapoint from testing;
-- keep only the most recently created row per FK before enforcing uniqueness.

DELETE FROM "datapoint_notes" a USING "datapoint_notes" b
  WHERE a."scope1Id" IS NOT NULL AND a."scope1Id" = b."scope1Id" AND a."createdAt" < b."createdAt";
DELETE FROM "datapoint_notes" a USING "datapoint_notes" b
  WHERE a."scope2Id" IS NOT NULL AND a."scope2Id" = b."scope2Id" AND a."createdAt" < b."createdAt";
DELETE FROM "datapoint_notes" a USING "datapoint_notes" b
  WHERE a."scope3Id" IS NOT NULL AND a."scope3Id" = b."scope3Id" AND a."createdAt" < b."createdAt";
DELETE FROM "datapoint_notes" a USING "datapoint_notes" b
  WHERE a."categoryId" IS NOT NULL AND a."categoryId" = b."categoryId" AND a."createdAt" < b."createdAt";
DELETE FROM "datapoint_notes" a USING "datapoint_notes" b
  WHERE a."scope1And2Id" IS NOT NULL AND a."scope1And2Id" = b."scope1And2Id" AND a."createdAt" < b."createdAt";
DELETE FROM "datapoint_notes" a USING "datapoint_notes" b
  WHERE a."statedTotalEmissionsId" IS NOT NULL AND a."statedTotalEmissionsId" = b."statedTotalEmissionsId" AND a."createdAt" < b."createdAt";
DELETE FROM "datapoint_notes" a USING "datapoint_notes" b
  WHERE a."biogenicEmissionsId" IS NOT NULL AND a."biogenicEmissionsId" = b."biogenicEmissionsId" AND a."createdAt" < b."createdAt";
DELETE FROM "datapoint_notes" a USING "datapoint_notes" b
  WHERE a."turnoverId" IS NOT NULL AND a."turnoverId" = b."turnoverId" AND a."createdAt" < b."createdAt";
DELETE FROM "datapoint_notes" a USING "datapoint_notes" b
  WHERE a."employeesId" IS NOT NULL AND a."employeesId" = b."employeesId" AND a."createdAt" < b."createdAt";

-- AlterTable
ALTER TABLE "datapoint_notes" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropIndex
DROP INDEX "datapoint_notes_scope1Id_idx";
DROP INDEX "datapoint_notes_scope2Id_idx";
DROP INDEX "datapoint_notes_scope3Id_idx";
DROP INDEX "datapoint_notes_categoryId_idx";
DROP INDEX "datapoint_notes_scope1And2Id_idx";
DROP INDEX "datapoint_notes_statedTotalEmissionsId_idx";
DROP INDEX "datapoint_notes_biogenicEmissionsId_idx";
DROP INDEX "datapoint_notes_turnoverId_idx";
DROP INDEX "datapoint_notes_employeesId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "datapoint_notes_scope1Id_key" ON "datapoint_notes"("scope1Id");
CREATE UNIQUE INDEX "datapoint_notes_scope2Id_key" ON "datapoint_notes"("scope2Id");
CREATE UNIQUE INDEX "datapoint_notes_scope3Id_key" ON "datapoint_notes"("scope3Id");
CREATE UNIQUE INDEX "datapoint_notes_categoryId_key" ON "datapoint_notes"("categoryId");
CREATE UNIQUE INDEX "datapoint_notes_scope1And2Id_key" ON "datapoint_notes"("scope1And2Id");
CREATE UNIQUE INDEX "datapoint_notes_statedTotalEmissionsId_key" ON "datapoint_notes"("statedTotalEmissionsId");
CREATE UNIQUE INDEX "datapoint_notes_biogenicEmissionsId_key" ON "datapoint_notes"("biogenicEmissionsId");
CREATE UNIQUE INDEX "datapoint_notes_turnoverId_key" ON "datapoint_notes"("turnoverId");
CREATE UNIQUE INDEX "datapoint_notes_employeesId_key" ON "datapoint_notes"("employeesId");
