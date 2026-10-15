-- Optional registry Report link for goals/initiatives (document provenance).
-- Historical rows stay NULL (orphaned/unspecified) but remain company-scoped.

ALTER TABLE "Goal" ADD COLUMN IF NOT EXISTS "reportId" TEXT;
ALTER TABLE "Initiative" ADD COLUMN IF NOT EXISTS "reportId" TEXT;

CREATE INDEX IF NOT EXISTS "Goal_reportId_idx" ON "Goal"("reportId");
CREATE INDEX IF NOT EXISTS "Goal_companyId_reportId_idx" ON "Goal"("companyId", "reportId");
CREATE INDEX IF NOT EXISTS "Initiative_reportId_idx" ON "Initiative"("reportId");
CREATE INDEX IF NOT EXISTS "Initiative_companyId_reportId_idx" ON "Initiative"("companyId", "reportId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Goal_reportId_fkey'
  ) THEN
    ALTER TABLE "Goal"
      ADD CONSTRAINT "Goal_reportId_fkey"
      FOREIGN KEY ("reportId") REFERENCES "Report"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Initiative_reportId_fkey'
  ) THEN
    ALTER TABLE "Initiative"
      ADD CONSTRAINT "Initiative_reportId_fkey"
      FOREIGN KEY ("reportId") REFERENCES "Report"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
