-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "companyName" TEXT,
    "wikidataId" TEXT,
    "reportYear" TEXT,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Report_url_key" ON "Report"("url");