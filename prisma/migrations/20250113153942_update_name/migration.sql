-- CreateTable
CREATE TABLE "Company" (
    "wikidataId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "internalComment" TEXT,
    "tags" TEXT[],

    CONSTRAINT "Company_pkey" PRIMARY KEY ("wikidataId")
);

-- CreateTable
CREATE TABLE "BaseYear" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "scope" INTEGER NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "BaseYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Industry" (
    "id" SERIAL NOT NULL,
    "gicsSubIndustryCode" TEXT NOT NULL,
    "companyWikidataId" TEXT NOT NULL,

    CONSTRAINT "Industry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndustryGics" (
    "subIndustryCode" TEXT NOT NULL,
    "subIndustryName" TEXT NOT NULL,
    "subIndustryDescription" TEXT NOT NULL,
    "sectorCode" TEXT NOT NULL,
    "sectorName" TEXT NOT NULL,
    "groupCode" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "industryCode" TEXT NOT NULL,
    "industryName" TEXT NOT NULL,

    CONSTRAINT "IndustryGics_pkey" PRIMARY KEY ("subIndustryCode")
);

-- CreateTable
CREATE TABLE "ReportingPeriod" (
    "id" SERIAL NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "year" TEXT NOT NULL,
    "reportURL" TEXT,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "ReportingPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Emissions" (
    "id" SERIAL NOT NULL,
    "reportingPeriodId" INTEGER,

    CONSTRAINT "Emissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatedTotalEmissions" (
    "id" SERIAL NOT NULL,
    "total" DOUBLE PRECISION,
    "scope3Id" INTEGER,
    "unit" TEXT NOT NULL,
    "emissionsId" INTEGER,

    CONSTRAINT "StatedTotalEmissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scope1And2" (
    "id" SERIAL NOT NULL,
    "total" DOUBLE PRECISION,
    "emissionsId" INTEGER,
    "unit" TEXT NOT NULL,

    CONSTRAINT "Scope1And2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiogenicEmissions" (
    "id" SERIAL NOT NULL,
    "total" DOUBLE PRECISION,
    "unit" TEXT NOT NULL,
    "emissionsId" INTEGER,

    CONSTRAINT "BiogenicEmissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scope1" (
    "id" SERIAL NOT NULL,
    "total" DOUBLE PRECISION,
    "unit" TEXT NOT NULL,
    "emissionsId" INTEGER,

    CONSTRAINT "Scope1_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scope2" (
    "id" SERIAL NOT NULL,
    "mb" DOUBLE PRECISION,
    "lb" DOUBLE PRECISION,
    "unknown" DOUBLE PRECISION,
    "unit" TEXT NOT NULL,
    "emissionsId" INTEGER,

    CONSTRAINT "Scope2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scope3" (
    "id" SERIAL NOT NULL,
    "emissionsId" INTEGER,
    "statedTotalEmissionsId" INTEGER,

    CONSTRAINT "Scope3_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scope3Category" (
    "id" SERIAL NOT NULL,
    "category" INTEGER NOT NULL,
    "total" DOUBLE PRECISION,
    "scope3Id" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "Scope3Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Economy" (
    "id" SERIAL NOT NULL,
    "reportingPeriodId" INTEGER,
    "turnoverId" INTEGER,

    CONSTRAINT "Economy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Turnover" (
    "id" SERIAL NOT NULL,
    "value" DOUBLE PRECISION,
    "currency" TEXT,
    "economyId" INTEGER NOT NULL,

    CONSTRAINT "Turnover_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employees" (
    "id" SERIAL NOT NULL,
    "value" DOUBLE PRECISION,
    "unit" TEXT,
    "economyId" INTEGER,

    CONSTRAINT "Employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "year" TEXT,
    "target" DOUBLE PRECISION,
    "baseYear" TEXT,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Initiative" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "year" TEXT,
    "scope" TEXT,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "Initiative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Metadata" (
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

    CONSTRAINT "Metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Industry_companyWikidataId_key" ON "Industry"("companyWikidataId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportingPeriod_companyId_year_key" ON "ReportingPeriod"("companyId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Emissions_reportingPeriodId_key" ON "Emissions"("reportingPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "StatedTotalEmissions_scope3Id_key" ON "StatedTotalEmissions"("scope3Id");

-- CreateIndex
CREATE UNIQUE INDEX "StatedTotalEmissions_emissionsId_key" ON "StatedTotalEmissions"("emissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "Scope1And2_emissionsId_key" ON "Scope1And2"("emissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "BiogenicEmissions_emissionsId_key" ON "BiogenicEmissions"("emissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "Scope1_emissionsId_key" ON "Scope1"("emissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "Scope2_emissionsId_key" ON "Scope2"("emissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "Scope3_emissionsId_key" ON "Scope3"("emissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "Scope3_statedTotalEmissionsId_key" ON "Scope3"("statedTotalEmissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "Economy_reportingPeriodId_key" ON "Economy"("reportingPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "Turnover_economyId_key" ON "Turnover"("economyId");

-- CreateIndex
CREATE UNIQUE INDEX "Employees_economyId_key" ON "Employees"("economyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "BaseYear" ADD CONSTRAINT "BaseYear_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("wikidataId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Industry" ADD CONSTRAINT "Industry_companyWikidataId_fkey" FOREIGN KEY ("companyWikidataId") REFERENCES "Company"("wikidataId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Industry" ADD CONSTRAINT "Industry_gicsSubIndustryCode_fkey" FOREIGN KEY ("gicsSubIndustryCode") REFERENCES "IndustryGics"("subIndustryCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportingPeriod" ADD CONSTRAINT "ReportingPeriod_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("wikidataId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Emissions" ADD CONSTRAINT "Emissions_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatedTotalEmissions" ADD CONSTRAINT "StatedTotalEmissions_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatedTotalEmissions" ADD CONSTRAINT "StatedTotalEmissions_scope3Id_fkey" FOREIGN KEY ("scope3Id") REFERENCES "Scope3"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scope1And2" ADD CONSTRAINT "Scope1And2_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiogenicEmissions" ADD CONSTRAINT "BiogenicEmissions_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scope1" ADD CONSTRAINT "Scope1_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scope2" ADD CONSTRAINT "Scope2_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scope3" ADD CONSTRAINT "Scope3_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scope3Category" ADD CONSTRAINT "Scope3Category_scope3Id_fkey" FOREIGN KEY ("scope3Id") REFERENCES "Scope3"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Economy" ADD CONSTRAINT "Economy_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turnover" ADD CONSTRAINT "Turnover_economyId_fkey" FOREIGN KEY ("economyId") REFERENCES "Economy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employees" ADD CONSTRAINT "Employees_economyId_fkey" FOREIGN KEY ("economyId") REFERENCES "Economy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("wikidataId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("wikidataId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_scope1Id_fkey" FOREIGN KEY ("scope1Id") REFERENCES "Scope1"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_scope2Id_fkey" FOREIGN KEY ("scope2Id") REFERENCES "Scope2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_scope3Id_fkey" FOREIGN KEY ("scope3Id") REFERENCES "Scope3"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_scope1And2Id_fkey" FOREIGN KEY ("scope1And2Id") REFERENCES "Scope1And2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_baseYearId_fkey" FOREIGN KEY ("baseYearId") REFERENCES "BaseYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_biogenicEmissionsId_fkey" FOREIGN KEY ("biogenicEmissionsId") REFERENCES "BiogenicEmissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_statedTotalEmissionsId_fkey" FOREIGN KEY ("statedTotalEmissionsId") REFERENCES "StatedTotalEmissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Scope3Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_turnoverId_fkey" FOREIGN KEY ("turnoverId") REFERENCES "Turnover"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_employeesId_fkey" FOREIGN KEY ("employeesId") REFERENCES "Employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
