-- Restore NOT NULL on scope emission units (backfill nulls to tCO2e before applying).
-- Reverts 20261123105000_nullable_scope_emission_units until Partner clients accept null units.
UPDATE "StatedTotalEmissions" SET "unit" = 'tCO2e' WHERE "unit" IS NULL;
UPDATE "Scope1And2" SET "unit" = 'tCO2e' WHERE "unit" IS NULL;
UPDATE "Scope1" SET "unit" = 'tCO2e' WHERE "unit" IS NULL;
UPDATE "Scope2" SET "unit" = 'tCO2e' WHERE "unit" IS NULL;

ALTER TABLE "StatedTotalEmissions" ALTER COLUMN "unit" SET NOT NULL;
ALTER TABLE "Scope1And2" ALTER COLUMN "unit" SET NOT NULL;
ALTER TABLE "Scope1" ALTER COLUMN "unit" SET NOT NULL;
ALTER TABLE "Scope2" ALTER COLUMN "unit" SET NOT NULL;
