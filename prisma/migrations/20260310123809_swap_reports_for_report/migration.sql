/*
  Warnings:

  - You are about to drop the `Reports` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Reports";

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "wikidataId" TEXT,
    "reportYear" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);
