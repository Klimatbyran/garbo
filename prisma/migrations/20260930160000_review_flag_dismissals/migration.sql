-- Manual Review: evidence-bound dismissals for computed data-quality flags.
CREATE TABLE "review_flag_dismissals" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "flagKey" TEXT NOT NULL,
    "evidenceFingerprint" TEXT NOT NULL,
    "note" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_flag_dismissals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "review_flag_dismissals_companyId_flagKey_evidenceFingerprint_key"
ON "review_flag_dismissals"("companyId", "flagKey", "evidenceFingerprint");

CREATE INDEX "review_flag_dismissals_flagKey_idx"
ON "review_flag_dismissals"("flagKey");

ALTER TABLE "review_flag_dismissals"
ADD CONSTRAINT "review_flag_dismissals_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "review_flag_dismissals"
ADD CONSTRAINT "review_flag_dismissals_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
