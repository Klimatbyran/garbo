-- Seasonal coverage crawl: short independent cooldown + job-run kind.

ALTER TYPE "CoverageNightlyJobKind" ADD VALUE 'seasonal_crawl';

ALTER TABLE "coverage_crawl_states"
ADD COLUMN "last_seasonal_crawled_at" TIMESTAMP(3),
ADD COLUMN "seasonal_skip_until" TIMESTAMP(3);

CREATE INDEX "coverage_crawl_states_seasonal_skip_until_idx"
ON "coverage_crawl_states"("seasonal_skip_until");
