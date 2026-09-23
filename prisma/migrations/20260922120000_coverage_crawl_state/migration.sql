-- Nightly coverage crawl memory: skip empty repeats and flag manual-find work.

CREATE TYPE "CoverageCrawlOutcome" AS ENUM ('found', 'empty', 'sparse', 'error');

CREATE TABLE "coverage_crawl_states" (
    "id" TEXT NOT NULL,
    "name_key" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "company_id" TEXT,
    "website_url" TEXT,
    "last_crawled_at" TIMESTAMP(3),
    "last_crawl_outcome" "CoverageCrawlOutcome",
    "last_crawl_reports_saved" INTEGER NOT NULL DEFAULT 0,
    "crawl_skip_until" TIMESTAMP(3),
    "needs_manual_find" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coverage_crawl_states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "coverage_crawl_states_name_key_key" ON "coverage_crawl_states"("name_key");
CREATE UNIQUE INDEX "coverage_crawl_states_company_id_key" ON "coverage_crawl_states"("company_id");
CREATE INDEX "coverage_crawl_states_needs_manual_find_idx" ON "coverage_crawl_states"("needs_manual_find");
CREATE INDEX "coverage_crawl_states_crawl_skip_until_idx" ON "coverage_crawl_states"("crawl_skip_until");

ALTER TABLE "coverage_crawl_states"
ADD CONSTRAINT "coverage_crawl_states_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "Company"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
