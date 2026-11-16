-- CreateTable
CREATE TABLE "model_eval_library_models" (
    "model_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "endpoint_tag" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "model_eval_library_models_pkey" PRIMARY KEY ("model_id")
);

-- CreateTable
CREATE TABLE "model_eval_declined_models" (
    "model_id" TEXT NOT NULL,
    "reason" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_eval_declined_models_pkey" PRIMARY KEY ("model_id")
);

-- CreateTable
CREATE TABLE "model_eval_library_reviews" (
    "id" TEXT NOT NULL,
    "model_ids" JSONB NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_eval_library_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "model_eval_library_reviews_created_at_idx" ON "model_eval_library_reviews"("created_at");
