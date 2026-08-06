ALTER TABLE "coverage_list_years"
ADD COLUMN "has_any_report_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "prod_ready_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "no_report_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "registry_refreshed_at" TIMESTAMP(3);

ALTER TABLE "coverage_list_entries"
ADD COLUMN "registry_report_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "has_prod_ready_report" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "registry_refreshed_at" TIMESTAMP(3);

CREATE INDEX "coverage_list_entries_year_id_registry_report_count_idx"
ON "coverage_list_entries"("year_id", "registry_report_count");

CREATE INDEX "coverage_list_entries_year_id_has_prod_ready_report_idx"
ON "coverage_list_entries"("year_id", "has_prod_ready_report");
