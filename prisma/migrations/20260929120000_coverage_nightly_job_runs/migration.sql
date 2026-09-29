-- Persist overnight coverage crawl / rematch job summaries for Validate Overview.

CREATE TYPE "CoverageNightlyJobKind" AS ENUM ('crawl', 'rematch');
CREATE TYPE "CoverageNightlyJobStatus" AS ENUM ('running', 'completed', 'failed');

CREATE TABLE "coverage_nightly_job_runs" (
    "id" TEXT NOT NULL,
    "kind" "CoverageNightlyJobKind" NOT NULL,
    "status" "CoverageNightlyJobStatus" NOT NULL DEFAULT 'running',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "summary" JSONB NOT NULL DEFAULT '{}',
    "failures" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coverage_nightly_job_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "coverage_nightly_job_runs_kind_started_at_idx"
ON "coverage_nightly_job_runs"("kind", "started_at");
