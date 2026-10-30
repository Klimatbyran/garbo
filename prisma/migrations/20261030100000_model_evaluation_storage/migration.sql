-- CreateTable
CREATE TABLE "model_eval_testsets" (
    "version" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "facit_hash" TEXT NOT NULL,
    "manifest" JSONB NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_eval_testsets_pkey" PRIMARY KEY ("version")
);

-- CreateTable
CREATE TABLE "model_eval_testset_reports" (
    "testset_version" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "markdown" TEXT NOT NULL,
    "facit_text" TEXT,

    CONSTRAINT "model_eval_testset_reports_pkey" PRIMARY KEY ("testset_version","name")
);

-- CreateTable
CREATE TABLE "model_eval_runs" (
    "id" TEXT NOT NULL,
    "testset_version" TEXT NOT NULL,
    "header" JSONB NOT NULL,
    "interrupted" JSONB NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "model_eval_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_eval_calls" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "call" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "model_eval_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_eval_feed_costs" (
    "run_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "cost" JSONB NOT NULL,

    CONSTRAINT "model_eval_feed_costs_pkey" PRIMARY KEY ("run_id","file_name")
);

-- CreateTable
CREATE TABLE "model_eval_paragraphs" (
    "hash" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "model_eval_paragraphs_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "model_eval_testset_uploads" (
    "upload_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "testset_version" TEXT NOT NULL,
    "markdown" TEXT NOT NULL,
    "facit_text" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_eval_testset_uploads_pkey" PRIMARY KEY ("upload_id","name")
);

-- CreateIndex
CREATE INDEX "model_eval_runs_created_at_idx" ON "model_eval_runs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "model_eval_calls_run_id_file_name_worker_id_key" ON "model_eval_calls"("run_id", "file_name", "worker_id");

-- AddForeignKey
ALTER TABLE "model_eval_testset_reports" ADD CONSTRAINT "model_eval_testset_reports_testset_version_fkey" FOREIGN KEY ("testset_version") REFERENCES "model_eval_testsets"("version") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_eval_calls" ADD CONSTRAINT "model_eval_calls_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "model_eval_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_eval_feed_costs" ADD CONSTRAINT "model_eval_feed_costs_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "model_eval_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

