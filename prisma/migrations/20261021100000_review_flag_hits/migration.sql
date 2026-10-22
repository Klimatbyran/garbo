-- Manual Review: precomputed flag hits (snapshot refreshed by CronJob).
-- Dismissals stay in review_flag_dismissals and are joined live at read time.

CREATE TABLE "review_flag_hits" (
    "flagKey" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "evidenceFingerprint" TEXT NOT NULL,
    "evidenceSummary" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_flag_hits_pkey" PRIMARY KEY ("flagKey", "companyId", "evidenceFingerprint")
);

CREATE INDEX "review_flag_hits_flagKey_companyId_idx"
ON "review_flag_hits"("flagKey", "companyId");

CREATE INDEX "review_flag_hits_companyId_idx"
ON "review_flag_hits"("companyId");

ALTER TABLE "review_flag_hits"
ADD CONSTRAINT "review_flag_hits_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "review_flag_runs" (
    "flagKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "computedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "error" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_flag_runs_pkey" PRIMARY KEY ("flagKey")
);
