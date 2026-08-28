-- Persist coverage company match outcomes and entry↔report discovery links.

CREATE TYPE "CoverageMatchStatus" AS ENUM ('matched', 'ambiguous', 'missing');
CREATE TYPE "CoverageMatchMethod" AS ENUM ('auto', 'manual');
CREATE TYPE "CoverageReportLinkStatus" AS ENUM ('matched', 'ambiguous', 'rejected');
CREATE TYPE "CoverageReportMatchSource" AS ENUM ('wikidata', 'name', 'manual');

ALTER TABLE "coverage_list_entries"
ADD COLUMN "match_status" "CoverageMatchStatus",
ADD COLUMN "match_method" "CoverageMatchMethod",
ADD COLUMN "suggested_company_id" TEXT,
ADD COLUMN "matched_at" TIMESTAMP(3);

CREATE INDEX "coverage_list_entries_suggested_company_id_idx"
ON "coverage_list_entries"("suggested_company_id");

CREATE INDEX "coverage_list_entries_year_id_match_status_idx"
ON "coverage_list_entries"("year_id", "match_status");

ALTER TABLE "coverage_list_entries"
ADD CONSTRAINT "coverage_list_entries_suggested_company_id_fkey"
FOREIGN KEY ("suggested_company_id") REFERENCES "Company"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Preserve existing staff overrides as manual persisted matches.
UPDATE "coverage_list_entries"
SET
  "match_status" = 'missing',
  "match_method" = 'manual',
  "matched_at" = CURRENT_TIMESTAMP
WHERE "match_confirmed_missing" = true;

UPDATE "coverage_list_entries"
SET
  "match_status" = 'matched',
  "match_method" = 'manual',
  "matched_at" = CURRENT_TIMESTAMP
WHERE "matched_company_id" IS NOT NULL
  AND "match_confirmed_missing" = false;

CREATE TABLE "coverage_entry_reports" (
    "id" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "link_status" "CoverageReportLinkStatus" NOT NULL DEFAULT 'matched',
    "match_source" "CoverageReportMatchSource" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coverage_entry_reports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "coverage_entry_reports_entry_id_report_id_key"
ON "coverage_entry_reports"("entry_id", "report_id");

CREATE INDEX "coverage_entry_reports_entry_id_idx"
ON "coverage_entry_reports"("entry_id");

CREATE INDEX "coverage_entry_reports_report_id_idx"
ON "coverage_entry_reports"("report_id");

ALTER TABLE "coverage_entry_reports"
ADD CONSTRAINT "coverage_entry_reports_entry_id_fkey"
FOREIGN KEY ("entry_id") REFERENCES "coverage_list_entries"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "coverage_entry_reports"
ADD CONSTRAINT "coverage_entry_reports_report_id_fkey"
FOREIGN KEY ("report_id") REFERENCES "Report"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
