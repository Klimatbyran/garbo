-- Postgres must commit the new enum value before any later statement can use it.
ALTER TYPE "CompanyIdentifierType" ADD VALUE 'BIC';
