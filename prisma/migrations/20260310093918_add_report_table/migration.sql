-- CreateTable
CREATE TABLE "Reports" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "wikidataId" TEXT,
    "reportYear" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "Reports_pkey" PRIMARY KEY ("id")
);
