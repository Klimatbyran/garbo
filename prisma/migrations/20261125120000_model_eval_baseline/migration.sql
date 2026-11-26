-- CreateTable
CREATE TABLE "model_eval_baseline" (
    "id" TEXT NOT NULL DEFAULT 'team',
    "setup" JSONB NOT NULL,
    "run_id" TEXT NOT NULL,
    "set_by_id" TEXT NOT NULL,
    "set_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "model_eval_baseline_pkey" PRIMARY KEY ("id")
);
