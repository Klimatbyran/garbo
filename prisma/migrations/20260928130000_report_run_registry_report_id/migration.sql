-- Link ReportRun → registry Report for scalable auto-run candidate exclusion.
-- Excludes poison/in-flight runs via indexed FK instead of loading URL lists.

ALTER TABLE "ReportRun" ADD COLUMN IF NOT EXISTS "registry_report_id" TEXT;

-- Backfill from URL match (pdfUrl may be url, sourceUrl, or s3Url).
UPDATE "ReportRun" AS rr
SET "registry_report_id" = sub.report_id
FROM (
  SELECT DISTINCT ON (rr2.id)
    rr2.id AS run_id,
    r.id AS report_id
  FROM "ReportRun" rr2
  INNER JOIN "Report" r ON (
    rr2."pdfUrl" = r.url
    OR (r."sourceUrl" IS NOT NULL AND rr2."pdfUrl" = r."sourceUrl")
    OR (r."s3Url" IS NOT NULL AND rr2."pdfUrl" = r."s3Url")
  )
  WHERE rr2."registry_report_id" IS NULL
  ORDER BY rr2.id, r.id
) AS sub
WHERE rr.id = sub.run_id
  AND rr."registry_report_id" IS NULL;

CREATE INDEX IF NOT EXISTS "ReportRun_registry_report_id_idx"
  ON "ReportRun"("registry_report_id");

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
