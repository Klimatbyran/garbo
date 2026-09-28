-- Dedicated watermark for auto-run failure observation (not lastTickAt heartbeat).

ALTER TABLE "pipeline_auto_run_config"
ADD COLUMN IF NOT EXISTS "outcome_observed_through" TIMESTAMP(3);
