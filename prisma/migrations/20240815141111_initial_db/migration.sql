-- CreateTable
CREATE TABLE "Company" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "wikidataId" TEXT,
    "url" TEXT NOT NULL,
    "industryGicsId" INTEGER,
    CONSTRAINT "Company_industryGicsId_fkey" FOREIGN KEY ("industryGicsId") REFERENCES "IndustryGics" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IndustryGics" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "sectorCode" TEXT NOT NULL,
    "sectorName" TEXT NOT NULL,
    "groupCode" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "industryCode" TEXT NOT NULL,
    "industryName" TEXT NOT NULL,
    "subIndustryCode" TEXT NOT NULL,
    "subIndustryName" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "FiscalYear" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "year" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "emissionsId" INTEGER NOT NULL,
    CONSTRAINT "FiscalYear_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Emissions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fiscalYearId" INTEGER NOT NULL,
    "scope1Id" INTEGER NOT NULL,
    "scope2Id" INTEGER NOT NULL,
    "scope3Id" INTEGER NOT NULL,
    CONSTRAINT "Emissions_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Scope1" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" REAL NOT NULL,
    "biogenic" REAL,
    "unit" TEXT NOT NULL,
    "baseYear" TEXT NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "emissionsId" INTEGER NOT NULL,
    CONSTRAINT "Scope1_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Scope1_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Scope2" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" REAL NOT NULL,
    "biogenic" REAL,
    "unit" TEXT NOT NULL,
    "mb" REAL,
    "lb" REAL,
    "baseYear" TEXT NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "emissionsId" INTEGER NOT NULL,
    CONSTRAINT "Scope2_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Scope2_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Scope3" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" REAL,
    "biogenic" REAL,
    "unit" TEXT NOT NULL,
    "baseYear" TEXT NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "emissionsId" INTEGER NOT NULL,
    CONSTRAINT "Scope3_emissionsId_fkey" FOREIGN KEY ("emissionsId") REFERENCES "Emissions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Scope3_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Scope3Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" INTEGER NOT NULL,
    "value" REAL,
    "scope3Id" INTEGER NOT NULL,
    "sourceId" INTEGER NOT NULL,
    CONSTRAINT "Scope3Category_scope3Id_fkey" FOREIGN KEY ("scope3Id") REFERENCES "Scope3" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Scope3Category_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Economy" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "turnover" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "employees" INTEGER NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "fiscalYearId" INTEGER NOT NULL,
    CONSTRAINT "Economy_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Economy_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "description" TEXT NOT NULL,
    "year" TEXT,
    "target" REAL,
    "baseYear" TEXT NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    CONSTRAINT "Goal_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Goal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Initiative" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "year" TEXT,
    "scope" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "sourceId" INTEGER NOT NULL,
    CONSTRAINT "Initiative_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Initiative_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Source" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT,
    "comment" TEXT,
    "userId" INTEGER NOT NULL,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Emissions_fiscalYearId_key" ON "Emissions"("fiscalYearId");

-- CreateIndex
CREATE UNIQUE INDEX "Emissions_scope1Id_key" ON "Emissions"("scope1Id");

-- CreateIndex
CREATE UNIQUE INDEX "Emissions_scope2Id_key" ON "Emissions"("scope2Id");

-- CreateIndex
CREATE UNIQUE INDEX "Emissions_scope3Id_key" ON "Emissions"("scope3Id");

-- CreateIndex
CREATE UNIQUE INDEX "Scope1_emissionsId_key" ON "Scope1"("emissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "Scope2_emissionsId_key" ON "Scope2"("emissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "Scope3_emissionsId_key" ON "Scope3"("emissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "Economy_fiscalYearId_key" ON "Economy"("fiscalYearId");
