-- CreateTable
CREATE TABLE "Profit" (
    "id" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "currency" TEXT,
    "economyId" TEXT NOT NULL,

    CONSTRAINT "Profit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profit_economyId_key" ON "Profit"("economyId");

-- AlterTable
ALTER TABLE "Metadata" ADD COLUMN "profitId" TEXT;

-- AddForeignKey
ALTER TABLE "Profit" ADD CONSTRAINT "Profit_economyId_fkey" FOREIGN KEY ("economyId") REFERENCES "Economy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_profitId_fkey" FOREIGN KEY ("profitId") REFERENCES "Profit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
