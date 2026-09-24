-- Pipeline auto-run config + ReportRun.autoRun attribution

CREATE TABLE "pipeline_auto_run_config" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "max_concurrent" INTEGER NOT NULL DEFAULT 1,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "run_options" JSONB NOT NULL DEFAULT '{}',
    "consecutive_docling_failures" INTEGER NOT NULL DEFAULT 0,
    "consecutive_report_failures" INTEGER NOT NULL DEFAULT 0,
    "paused_reason" TEXT,
    "disabled_reason" TEXT,
    "last_tick_at" TIMESTAMP(3),
    "last_enqueued_at" TIMESTAMP(3),
    "last_error" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipeline_auto_run_config_pkey" PRIMARY KEY ("id")
);

INSERT INTO "pipeline_auto_run_config" ("id", "updated_at")
VALUES ('default', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "ReportRun" ADD COLUMN IF NOT EXISTS "auto_run" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "ReportRun_auto_run_status_idx" ON "ReportRun"("auto_run", "status");
