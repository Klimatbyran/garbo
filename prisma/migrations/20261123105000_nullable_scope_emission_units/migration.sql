-- Allow null units when extraction leaves them unset (do not invent tCO2e on save).
ALTER TABLE "StatedTotalEmissions" ALTER COLUMN "unit" DROP NOT NULL;
ALTER TABLE "Scope1And2" ALTER COLUMN "unit" DROP NOT NULL;
ALTER TABLE "Scope1" ALTER COLUMN "unit" DROP NOT NULL;
ALTER TABLE "Scope2" ALTER COLUMN "unit" DROP NOT NULL;
