-- Move all data to the new structure

INSERT INTO "Company" SELECT * FROM "Company2";
INSERT INTO "BaseYear" SELECT * FROM "BaseYear2";
INSERT INTO "IndustryGics" SELECT * FROM "IndustryGics2";
INSERT INTO "Industry" SELECT * FROM "Industry2";
INSERT INTO "ReportingPeriod" SELECT * FROM "ReportingPeriod2";
INSERT INTO "Emissions" SELECT * FROM "Emissions2";
INSERT INTO "Scope1" SELECT * FROM "Scope12";
INSERT INTO "Scope1And2" SELECT * FROM "Scope1And22";
INSERT INTO "Scope2" SELECT * FROM "Scope22";
INSERT INTO "Scope3" SELECT * FROM "Scope32";
INSERT INTO "Scope3Category" SELECT * FROM "Scope3Category2";
INSERT INTO "StatedTotalEmissions" SELECT * FROM "StatedTotalEmissions2";
INSERT INTO "BiogenicEmissions" SELECT * FROM "BiogenicEmissions2";
INSERT INTO "Economy" SELECT * FROM "Economy2";
INSERT INTO "Turnover" SELECT * FROM "Turnover2";
INSERT INTO "Employees" SELECT * FROM "Employees2";
INSERT INTO "Goal" SELECT * FROM "Goal2";
INSERT INTO "Initiative" SELECT * FROM "Initiative2";
INSERT INTO "User" SELECT * FROM "User2";
INSERT INTO "Metadata" SELECT * FROM "Metadata2";