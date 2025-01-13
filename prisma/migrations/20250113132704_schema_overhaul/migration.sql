-- CreateTable
CREATE TABLE "Company2" (
    "wikidataId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "internalComment" TEXT,
    "tags" TEXT[],

    CONSTRAINT "Company2_pkey" PRIMARY KEY ("wikidataId")
);

-- CreateTable
CREATE TABLE "BaseYear2" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "scope" INTEGER NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "BaseYear2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Industry2" (
    "id" SERIAL NOT NULL,
    "gicsSubIndustryCode" TEXT NOT NULL,
    "companyWikidataId" TEXT NOT NULL,

    CONSTRAINT "Industry2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndustryGics2" (
    "subIndustryCode" TEXT NOT NULL,
    "subIndustryName" TEXT NOT NULL DEFAULT '',
    "subIndustryDescription" TEXT NOT NULL DEFAULT '',
    "sectorCode" TEXT NOT NULL,
    "sectorName" TEXT NOT NULL DEFAULT '',
    "groupCode" TEXT NOT NULL,
    "groupName" TEXT NOT NULL DEFAULT '',
    "industryCode" TEXT NOT NULL,
    "industryName" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "IndustryGics2_pkey" PRIMARY KEY ("subIndustryCode")
);

-- CreateTable
CREATE TABLE "ReportingPeriod2" (
    "id" SERIAL NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "year" TEXT NOT NULL,
    "reportURL" TEXT,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "ReportingPeriod2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Emissions2" (
    "id" SERIAL NOT NULL,
    "reportingPeriodId" INTEGER,

    CONSTRAINT "Emissions2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatedTotalEmissions2" (
    "id" SERIAL NOT NULL,
    "total" DOUBLE PRECISION,
    "scope3Id" INTEGER,
    "unit" TEXT NOT NULL,
    "emissionsId" INTEGER,

    CONSTRAINT "StatedTotalEmissions2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scope1And22" (
    "id" SERIAL NOT NULL,
    "total" DOUBLE PRECISION,
    "emissionsId" INTEGER,
    "unit" TEXT NOT NULL,

    CONSTRAINT "Scope1And22_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiogenicEmissions2" (
    "id" SERIAL NOT NULL,
    "total" DOUBLE PRECISION,
    "unit" TEXT NOT NULL,
    "emissionsId" INTEGER,

    CONSTRAINT "BiogenicEmissions2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scope12" (
    "id" SERIAL NOT NULL,
    "total" DOUBLE PRECISION,
    "unit" TEXT NOT NULL,
    "emissionsId" INTEGER,

    CONSTRAINT "Scope12_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scope22" (
    "id" SERIAL NOT NULL,
    "mb" DOUBLE PRECISION,
    "lb" DOUBLE PRECISION,
    "unknown" DOUBLE PRECISION,
    "unit" TEXT NOT NULL,
    "emissionsId" INTEGER,

    CONSTRAINT "Scope22_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scope32" (
    "id" SERIAL NOT NULL,
    "emissionsId" INTEGER,
    "statedTotalEmissionsId" INTEGER,

    CONSTRAINT "Scope32_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scope3Category2" (
    "id" SERIAL NOT NULL,
    "category" INTEGER NOT NULL,
    "total" DOUBLE PRECISION,
    "scope3Id" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "Scope3Category2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Economy2" (
    "id" SERIAL NOT NULL,
    "reportingPeriodId" INTEGER,
    "turnoverId" INTEGER,

    CONSTRAINT "Economy2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Turnover2" (
    "id" SERIAL NOT NULL,
    "value" DOUBLE PRECISION,
    "currency" TEXT,
    "economyId" INTEGER NOT NULL,

    CONSTRAINT "Turnover2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employees2" (
    "id" SERIAL NOT NULL,
    "value" DOUBLE PRECISION,
    "unit" TEXT,
    "economyId" INTEGER,

    CONSTRAINT "Employees2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal2" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "year" TEXT,
    "target" DOUBLE PRECISION,
    "baseYear" TEXT,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "Goal2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Initiative2" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "year" TEXT,
    "scope" TEXT,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "Initiative2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Metadata2" (
    "id" SERIAL NOT NULL,
    "comment" TEXT,
    "source" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "verifiedByUserId" INTEGER,
    "goalId" INTEGER,
    "initiativeId" INTEGER,
    "scope1Id" INTEGER,
    "scope2Id" INTEGER,
    "scope3Id" INTEGER,
    "scope1And2Id" INTEGER,
    "reportingPeriodId" INTEGER,
    "baseYearId" INTEGER,
    "biogenicEmissionsId" INTEGER,
    "statedTotalEmissionsId" INTEGER,
    "industryId" INTEGER,
    "categoryId" INTEGER,
    "turnoverId" INTEGER,
    "employeesId" INTEGER,

    CONSTRAINT "Metadata2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User2" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "User2_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Industry2_companyWikidataId_key" ON "Industry2"("companyWikidataId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportingPeriod2_companyId_year_key" ON "ReportingPeriod2"("companyId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Emissions2_reportingPeriodId_key" ON "Emissions2"("reportingPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "StatedTotalEmissions2_scope3Id_key" ON "StatedTotalEmissions2"("scope3Id");

-- CreateIndex
CREATE UNIQUE INDEX "StatedTotalEmissions2_emissionsId_key" ON "StatedTotalEmissions2"("emissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "Scope1And22_emissionsId_key" ON "Scope1And22"("emissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "BiogenicEmissions2_emissionsId_key" ON "BiogenicEmissions2"("emissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "Scope12_emissionsId_key" ON "Scope12"("emissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "Scope22_emissionsId_key" ON "Scope22"("emissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "Scope32_emissionsId_key" ON "Scope32"("emissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "Scope32_statedTotalEmissionsId_key" ON "Scope32"("statedTotalEmissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "Economy2_reportingPeriodId_key" ON "Economy2"("reportingPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "Turnover2_economyId_key" ON "Turnover2"("economyId");

-- CreateIndex
CREATE UNIQUE INDEX "Employees2_economyId_key" ON "Employees2"("economyId");

-- CreateIndex
CREATE UNIQUE INDEX "User2_email_key" ON "User2"("email");

-- AddForeignKey
ALTER TABLE "BaseYear2" ADD CONSTRAINT "BaseYear2_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company2"("wikidataId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Industry2" ADD CONSTRAINT "Industry2_companyWikidataId_fkey" FOREIGN KEY ("companyWikidataId") REFERENCES "Company2"("wikidataId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Industry2" ADD CONSTRAINT "Industry2_gicsSubIndustryCode_fkey" FOREIGN KEY ("gicsSubIndustryCode") REFERENCES "IndustryGics2"("subIndustryCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportingPeriod2" ADD CONSTRAINT "ReportingPeriod2_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company2"("wikidataId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Emissions2" ADD CONSTRAINT "Emissions2_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatedTotalEmissions2" ADD CONSTRAINT "StatedTotalEmissions2_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatedTotalEmissions2" ADD CONSTRAINT "StatedTotalEmissions2_scope3Id_fkey" FOREIGN KEY ("scope3Id") REFERENCES "Scope32"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scope1And22" ADD CONSTRAINT "Scope1And22_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiogenicEmissions2" ADD CONSTRAINT "BiogenicEmissions2_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scope12" ADD CONSTRAINT "Scope12_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scope22" ADD CONSTRAINT "Scope22_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scope32" ADD CONSTRAINT "Scope32_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scope3Category2" ADD CONSTRAINT "Scope3Category2_scope3Id_fkey" FOREIGN KEY ("scope3Id") REFERENCES "Scope32"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Economy2" ADD CONSTRAINT "Economy2_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turnover2" ADD CONSTRAINT "Turnover2_economyId_fkey" FOREIGN KEY ("economyId") REFERENCES "Economy2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employees2" ADD CONSTRAINT "Employees2_economyId_fkey" FOREIGN KEY ("economyId") REFERENCES "Economy2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal2" ADD CONSTRAINT "Goal2_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company2"("wikidataId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Initiative2" ADD CONSTRAINT "Initiative2_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company2"("wikidataId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata2" ADD CONSTRAINT "Metadata2_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata2" ADD CONSTRAINT "Metadata2_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata2" ADD CONSTRAINT "Metadata2_scope1Id_fkey" FOREIGN KEY ("scope1Id") REFERENCES "Scope12"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata2" ADD CONSTRAINT "Metadata2_scope2Id_fkey" FOREIGN KEY ("scope2Id") REFERENCES "Scope22"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata2" ADD CONSTRAINT "Metadata2_scope3Id_fkey" FOREIGN KEY ("scope3Id") REFERENCES "Scope32"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata2" ADD CONSTRAINT "Metadata2_scope1And2Id_fkey" FOREIGN KEY ("scope1And2Id") REFERENCES "Scope1And22"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata2" ADD CONSTRAINT "Metadata2_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata2" ADD CONSTRAINT "Metadata2_baseYearId_fkey" FOREIGN KEY ("baseYearId") REFERENCES "BaseYear2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata2" ADD CONSTRAINT "Metadata2_biogenicEmissionsId_fkey" FOREIGN KEY ("biogenicEmissionsId") REFERENCES "BiogenicEmissions2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata2" ADD CONSTRAINT "Metadata2_statedTotalEmissionsId_fkey" FOREIGN KEY ("statedTotalEmissionsId") REFERENCES "StatedTotalEmissions2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata2" ADD CONSTRAINT "Metadata2_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User2"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata2" ADD CONSTRAINT "Metadata2_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "User2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata2" ADD CONSTRAINT "Metadata2_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata2" ADD CONSTRAINT "Metadata2_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Scope3Category2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata2" ADD CONSTRAINT "Metadata2_turnoverId_fkey" FOREIGN KEY ("turnoverId") REFERENCES "Turnover2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata2" ADD CONSTRAINT "Metadata2_employeesId_fkey" FOREIGN KEY ("employeesId") REFERENCES "Employees2"("id") ON DELETE SET NULL ON UPDATE CASCADE;
