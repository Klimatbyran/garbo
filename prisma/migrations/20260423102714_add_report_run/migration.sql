-- CreateTable
CREATE TABLE "ReportRun" (
    "id" TEXT NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "wikidataId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportRunJob" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "queueName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportRunId" TEXT NOT NULL,

    CONSTRAINT "ReportRunJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportRun_wikidataId_idx" ON "ReportRun"("wikidataId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportRun_pdfUrl_key" ON "ReportRun"("pdfUrl");

-- CreateIndex
CREATE INDEX "ReportRunJob_reportRunId_idx" ON "ReportRunJob"("reportRunId");

-- AddForeignKey
ALTER TABLE "ReportRunJob" ADD CONSTRAINT "ReportRunJob_reportRunId_fkey" FOREIGN KEY ("reportRunId") REFERENCES "ReportRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
