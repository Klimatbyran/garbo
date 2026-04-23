-- AlterTable
ALTER TABLE "ReportRun" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'running';

-- AlterTable
ALTER TABLE "ReportRunJob" ADD COLUMN     "failedReason" TEXT;
