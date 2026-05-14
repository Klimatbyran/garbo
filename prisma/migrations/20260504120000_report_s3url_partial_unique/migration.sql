-- Partial unique: multiple NULL s3Url values are allowed; duplicate non-null s3Url is not.
-- Run `npx ts-node scripts/dedupe-report-registry.ts` (or equivalent) against environments that may already contain duplicate s3Url rows before applying this migration.
CREATE UNIQUE INDEX "Report_s3Url_key" ON "Report"("s3Url") WHERE "s3Url" IS NOT NULL;
