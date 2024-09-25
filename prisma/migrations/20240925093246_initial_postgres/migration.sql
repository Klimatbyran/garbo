-- CreateTable
CREATE TABLE "Company" (
    "wikidataId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "internalComment" TEXT,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("wikidataId")
);

-- CreateTable
CREATE TABLE "BaseYear" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "scope" INTEGER NOT NULL,
    "companyId" TEXT NOT NULL,
    "metadataId" INTEGER NOT NULL,

    CONSTRAINT "BaseYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Industry" (
    "id" SERIAL NOT NULL,
    "gicsSubIndustryCode" TEXT NOT NULL,
    "metadataId" INTEGER NOT NULL,
    "companyWikidataId" TEXT NOT NULL,

    CONSTRAINT "Industry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndustryGics" (
    "sectorCode" TEXT NOT NULL,
    "groupCode" TEXT NOT NULL,
    "industryCode" TEXT NOT NULL,
    "subIndustryCode" TEXT NOT NULL,

    CONSTRAINT "IndustryGics_pkey" PRIMARY KEY ("subIndustryCode")
);

-- CreateTable
CREATE TABLE "ReportingPeriod" (
    "id" SERIAL NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reportURL" TEXT,
    "companyId" TEXT NOT NULL,
    "emissionsId" INTEGER,
    "economyId" INTEGER,
    "metadataId" INTEGER NOT NULL,

    CONSTRAINT "ReportingPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Emissions" (
    "id" SERIAL NOT NULL,
    "scope1Id" INTEGER,
    "scope2Id" INTEGER,
    "scope3Id" INTEGER,
    "biogenicEmissionsId" INTEGER,
    "scope1And2Id" INTEGER,
    "statedTotalEmissionsId" INTEGER,

    CONSTRAINT "Emissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatedTotalEmissions" (
    "id" SERIAL NOT NULL,
    "total" DOUBLE PRECISION,
    "metadataId" INTEGER NOT NULL,
    "scope3Id" INTEGER,
    "unit" TEXT NOT NULL,

    CONSTRAINT "StatedTotalEmissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scope1And2" (
    "id" SERIAL NOT NULL,
    "total" DOUBLE PRECISION,
    "metadataId" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "Scope1And2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiogenicEmissions" (
    "id" SERIAL NOT NULL,
    "total" DOUBLE PRECISION,
    "metadataId" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "BiogenicEmissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scope1" (
    "id" SERIAL NOT NULL,
    "total" DOUBLE PRECISION,
    "metadataId" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "Scope1_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scope2" (
    "id" SERIAL NOT NULL,
    "mb" DOUBLE PRECISION,
    "lb" DOUBLE PRECISION,
    "unknown" DOUBLE PRECISION,
    "metadataId" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "Scope2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scope3" (
    "id" SERIAL NOT NULL,
    "statedTotalEmissionsId" INTEGER,
    "metadataId" INTEGER NOT NULL,

    CONSTRAINT "Scope3_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scope3Category" (
    "id" SERIAL NOT NULL,
    "category" INTEGER NOT NULL,
    "total" DOUBLE PRECISION,
    "scope3Id" INTEGER NOT NULL,
    "metadataId" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "Scope3Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Economy" (
    "id" SERIAL NOT NULL,
    "turnoverId" INTEGER,
    "employeesId" INTEGER,

    CONSTRAINT "Economy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Turnover" (
    "id" SERIAL NOT NULL,
    "value" DOUBLE PRECISION,
    "currency" TEXT,
    "metadataId" INTEGER NOT NULL,

    CONSTRAINT "Turnover_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employees" (
    "id" SERIAL NOT NULL,
    "value" DOUBLE PRECISION,
    "unit" TEXT,
    "metadataId" INTEGER NOT NULL,

    CONSTRAINT "Employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "year" TEXT,
    "target" DOUBLE PRECISION,
    "baseYear" TEXT,
    "metadataId" INTEGER NOT NULL,
    "companyId" TEXT NOT NULL,
    "reportingPeriodId" INTEGER,

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
    "metadataId" INTEGER NOT NULL,
    "reportingPeriodId" INTEGER,

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
    "dataOrigin" TEXT,

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
CREATE UNIQUE INDEX "ReportingPeriod_emissionsId_key" ON "ReportingPeriod"("emissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportingPeriod_economyId_key" ON "ReportingPeriod"("economyId");

-- CreateIndex
CREATE UNIQUE INDEX "Emissions_scope1Id_key" ON "Emissions"("scope1Id");

-- CreateIndex
CREATE UNIQUE INDEX "Emissions_scope2Id_key" ON "Emissions"("scope2Id");

-- CreateIndex
CREATE UNIQUE INDEX "Emissions_scope3Id_key" ON "Emissions"("scope3Id");

-- CreateIndex
CREATE UNIQUE INDEX "Emissions_biogenicEmissionsId_key" ON "Emissions"("biogenicEmissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "Emissions_scope1And2Id_key" ON "Emissions"("scope1And2Id");

-- CreateIndex
CREATE UNIQUE INDEX "Emissions_statedTotalEmissionsId_key" ON "Emissions"("statedTotalEmissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "StatedTotalEmissions_scope3Id_key" ON "StatedTotalEmissions"("scope3Id");

-- CreateIndex
CREATE UNIQUE INDEX "Scope3_statedTotalEmissionsId_key" ON "Scope3"("statedTotalEmissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "Economy_turnoverId_key" ON "Economy"("turnoverId");

-- CreateIndex
CREATE UNIQUE INDEX "Economy_employeesId_key" ON "Economy"("employeesId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "BaseYear" ADD CONSTRAINT "BaseYear_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BaseYear" ADD CONSTRAINT "BaseYear_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("wikidataId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Industry" ADD CONSTRAINT "Industry_companyWikidataId_fkey" FOREIGN KEY ("companyWikidataId") REFERENCES "Company"("wikidataId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Industry" ADD CONSTRAINT "Industry_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Industry" ADD CONSTRAINT "Industry_gicsSubIndustryCode_fkey" FOREIGN KEY ("gicsSubIndustryCode") REFERENCES "IndustryGics"("subIndustryCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportingPeriod" ADD CONSTRAINT "ReportingPeriod_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportingPeriod" ADD CONSTRAINT "ReportingPeriod_economyId_fkey" FOREIGN KEY ("economyId") REFERENCES "Economy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportingPeriod" ADD CONSTRAINT "ReportingPeriod_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportingPeriod" ADD CONSTRAINT "ReportingPeriod_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("wikidataId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Emissions" ADD CONSTRAINT "Emissions_statedTotalEmissionsId_fkey" FOREIGN KEY ("statedTotalEmissionsId") REFERENCES "StatedTotalEmissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Emissions" ADD CONSTRAINT "Emissions_scope1And2Id_fkey" FOREIGN KEY ("scope1And2Id") REFERENCES "Scope1And2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Emissions" ADD CONSTRAINT "Emissions_biogenicEmissionsId_fkey" FOREIGN KEY ("biogenicEmissionsId") REFERENCES "BiogenicEmissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Emissions" ADD CONSTRAINT "Emissions_scope1Id_fkey" FOREIGN KEY ("scope1Id") REFERENCES "Scope1"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Emissions" ADD CONSTRAINT "Emissions_scope2Id_fkey" FOREIGN KEY ("scope2Id") REFERENCES "Scope2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Emissions" ADD CONSTRAINT "Emissions_scope3Id_fkey" FOREIGN KEY ("scope3Id") REFERENCES "Scope3"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatedTotalEmissions" ADD CONSTRAINT "StatedTotalEmissions_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatedTotalEmissions" ADD CONSTRAINT "StatedTotalEmissions_scope3Id_fkey" FOREIGN KEY ("scope3Id") REFERENCES "Scope3"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scope1And2" ADD CONSTRAINT "Scope1And2_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiogenicEmissions" ADD CONSTRAINT "BiogenicEmissions_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scope1" ADD CONSTRAINT "Scope1_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scope2" ADD CONSTRAINT "Scope2_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scope3" ADD CONSTRAINT "Scope3_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scope3Category" ADD CONSTRAINT "Scope3Category_scope3Id_fkey" FOREIGN KEY ("scope3Id") REFERENCES "Scope3"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scope3Category" ADD CONSTRAINT "Scope3Category_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Economy" ADD CONSTRAINT "Economy_turnoverId_fkey" FOREIGN KEY ("turnoverId") REFERENCES "Turnover"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Economy" ADD CONSTRAINT "Economy_employeesId_fkey" FOREIGN KEY ("employeesId") REFERENCES "Employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turnover" ADD CONSTRAINT "Turnover_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employees" ADD CONSTRAINT "Employees_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("wikidataId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("wikidataId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
