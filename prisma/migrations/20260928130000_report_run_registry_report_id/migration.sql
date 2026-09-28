-- Link ReportRun → registry Report for scalable auto-run candidate exclusion.
-- Excludes poison/in-flight runs via indexed FK instead of loading URL lists.

ALTER TABLE "ReportRun" ADD COLUMN IF NOT EXISTS "registry_report_id" TEXT;

-- Backfill by match priority (url → sourceUrl → s3Url) using separate updates
-- so unique indexes on Report.url / Report.sourceUrl can be used.
UPDATE "ReportRun" AS rr
SET "registry_report_id" = r.id
FROM "Report" r
WHERE rr."registry_report_id" IS NULL
  AND rr."pdfUrl" = r.url;

UPDATE "ReportRun" AS rr
SET "registry_report_id" = r.id
FROM "Report" r
WHERE rr."registry_report_id" IS NULL
  AND r."sourceUrl" IS NOT NULL
  AND rr."pdfUrl" = r."sourceUrl";

-- s3Url is not unique; pick a deterministic report when several match.
UPDATE "ReportRun" AS rr
SET "registry_report_id" = sub.report_id
FROM (
  SELECT DISTINCT ON (rr2.id)
    rr2.id AS run_id,
    r.id AS report_id
  FROM "ReportRun" rr2
  INNER JOIN "Report" r
    ON r."s3Url" IS NOT NULL AND rr2."pdfUrl" = r."s3Url"
  WHERE rr2."registry_report_id" IS NULL
  ORDER BY rr2.id, r.id
) AS sub
WHERE rr.id = sub.run_id
  AND rr."registry_report_id" IS NULL;

-- Composite covers FK lookups and status filters; no separate single-column index.
CREATE INDEX IF NOT EXISTS "ReportRun_registry_report_id_status_idx"
  ON "ReportRun"("registry_report_id", "status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ReportRun_registry_report_id_fkey'
  ) THEN
    ALTER TABLE "ReportRun"
      ADD CONSTRAINT "ReportRun_registry_report_id_fkey"
      FOREIGN KEY ("registry_report_id") REFERENCES "Report"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
