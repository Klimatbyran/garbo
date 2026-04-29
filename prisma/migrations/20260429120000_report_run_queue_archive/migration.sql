-- Squashed: Batch, ReportRun, ReportRunJob (queue archive). Single migration replacing the prior chain.

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "batch_name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Batch_batch_name_key" ON "Batch"("batch_name");

-- CreateTable
CREATE TABLE "ReportRun" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "companyName" TEXT,
    "wikidataId" TEXT,
    "batch_db_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'running',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReportRun_threadId_key" ON "ReportRun"("threadId");

-- CreateIndex
CREATE INDEX "ReportRun_pdfUrl_idx" ON "ReportRun"("pdfUrl");

-- CreateIndex
CREATE INDEX "ReportRun_wikidataId_idx" ON "ReportRun"("wikidataId");

-- CreateIndex
CREATE INDEX "ReportRun_batch_db_id_idx" ON "ReportRun"("batch_db_id");

-- AddForeignKey
ALTER TABLE "ReportRun" ADD CONSTRAINT "ReportRun_batch_db_id_fkey" FOREIGN KEY ("batch_db_id") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ReportRunJob" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "queueName" TEXT NOT NULL,
    "wikidataId" TEXT,
    "status" TEXT NOT NULL,
    "approved_timestamp" TEXT,
    "auto_approve" BOOLEAN NOT NULL DEFAULT false,
    "failedReason" TEXT,
    "prompt" TEXT,
    "queryTexts" JSONB,
    "markdown" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportRunId" TEXT NOT NULL,

    CONSTRAINT "ReportRunJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportRunJob_reportRunId_idx" ON "ReportRunJob"("reportRunId");

-- AddForeignKey
ALTER TABLE "ReportRunJob" ADD CONSTRAINT "ReportRunJob_reportRunId_fkey" FOREIGN KEY ("reportRunId") REFERENCES "ReportRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
