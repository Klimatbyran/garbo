-- Link ReportRun → registry Report for scalable auto-run candidate exclusion.
-- Excludes poison/in-flight runs via indexed FK instead of loading URL lists.
-- Historical rows are left NULL; enqueue/worker fill the FK going forward.
-- Unlinked terminals stay covered by the in-memory claim net in auto-run.

ALTER TABLE "ReportRun" ADD COLUMN IF NOT EXISTS "registry_report_id" TEXT;

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
