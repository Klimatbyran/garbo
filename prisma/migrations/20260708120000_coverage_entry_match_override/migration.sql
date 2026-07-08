-- Staff-confirmed company match for a coverage list entry (Validate Coverage tab).

ALTER TABLE "coverage_list_entries" ADD COLUMN "matched_company_id" TEXT;

CREATE INDEX "coverage_list_entries_matched_company_id_idx" ON "coverage_list_entries"("matched_company_id");

ALTER TABLE "coverage_list_entries" ADD CONSTRAINT "coverage_list_entries_matched_company_id_fkey" FOREIGN KEY ("matched_company_id") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
