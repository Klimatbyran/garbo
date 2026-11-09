-- AlterTable
ALTER TABLE "model_eval_runs" ADD COLUMN     "promptset_version" TEXT;

-- CreateTable
CREATE TABLE "model_eval_promptsets" (
    "version" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clark_commit" TEXT NOT NULL,
    "prompts" JSONB NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_eval_promptsets_pkey" PRIMARY KEY ("version")
);

-- CreateTable
CREATE TABLE "model_eval_run_summaries" (
    "run_id" TEXT NOT NULL,
    "testset_version" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "setup_key" TEXT NOT NULL,
    "row_key" TEXT NOT NULL,
    "setup" JSONB NOT NULL,
    "worker_ids" JSONB NOT NULL,
    "promptset_version" TEXT,
    "facit_hash" TEXT NOT NULL,
    "scoring_version" INTEGER NOT NULL,
    "measures" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "model_eval_run_summaries_pkey" PRIMARY KEY ("run_id")
);

-- CreateIndex
CREATE INDEX "model_eval_run_summaries_testset_version_idx" ON "model_eval_run_summaries"("testset_version");

-- CreateIndex
CREATE INDEX "model_eval_runs_promptset_version_idx" ON "model_eval_runs"("promptset_version");

-- AddForeignKey
ALTER TABLE "model_eval_runs" ADD CONSTRAINT "model_eval_runs_promptset_version_fkey" FOREIGN KEY ("promptset_version") REFERENCES "model_eval_promptsets"("version") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_eval_run_summaries" ADD CONSTRAINT "model_eval_run_summaries_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "model_eval_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
