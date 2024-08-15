model Company {
  id             Int          @id @default(autoincrement())
  name           String       @unique
  description    String
  /// wikidataId is primarily used to export to or import from wikidata
  wikidataId     String?
  /// Company website URL
  url            String
  fiscalYears    FiscalYear[]
  industryGicsId Int

  // Is this relationship correct?
  // Should companies be allowed to have several industries?
  industryGics IndustryGics @relation(fields: [industryGicsId], references: [id])
}

model IndustryGics {
  id              Int       @id @default(autoincrement())
  name            String
  sectorCode      String
  sectorName      String
  groupCode       String
  groupName       String
  industryCode    String
  industryName    String
  subIndustryCode String
  subIndustryName String
  companies       Company[]
}

model FiscalYear {
  id        Int        @id @default(autoincrement())
  year      String
  companyId Int
  emissions Emissions?
  economy   Economy?

  company Company @relation(fields: [companyId], references: [id])
}

/// Reported emissions for a specific fiscalYear
model Emissions {
  id           Int @id @default(autoincrement())
  fiscalYearId Int
  scope1Id     Int
  scope2Id     Int
  scope3Id     Int

  fiscalYear FiscalYear @relation(fields: [fiscalYearId], references: [id])
  scope1     Scope1     @relation(fields: [scope1Id], references: [id])
  scope2     Scope2     @relation(fields: [scope2Id], references: [id])
  scope3     Scope3     @relation(fields: [scope3Id], references: [id])
}

model Scope1 {
  id        Int    @id @default(autoincrement())
  emissions Float
  biogenic  Float?
  unit      String
  baseYear  String
  sourceId  Int    @relation(fields: [sourceId], references: [id])

  source Source @relation(fields: [sourceId], references: [id])
}

model Scope2 {
  id        Int    @id @default(autoincrement())
  emissions Float
  biogenic  Float?
  unit      String
  mb        Float?
  lb        Float?
  baseYear  String
  sourceId  Int    @relation(fields: [sourceId], references: [id])

  source Source @relation(fields: [sourceId], references: [id])
}

model Scope3 {
  id        Int    @id @default(autoincrement())
  emissions Float?
  biogenic  Float?
  unit      String
  baseYear  String
  sourceId  Int    @relation(fields: [sourceId], references: [id])

  categories Scope3Category[]

  source Source @relation(fields: [sourceId], references: [id])
}

model Scope3Category {
  id        Int                @id @default(autoincrement())
  category  Scope3CategoryEnum
  emissions Float?
  scope3Id  Int                @relation(fields: [scope3Id], references: [id])
  sourceId  Int                @relation(fields: [sourceId], references: [id])

  scope3 Scope3 @relation(fields: [scope3Id], references: [id])
  source Source @relation(fields: [sourceId], references: [id])
}

model Economy {
  id           Int    @id @default(autoincrement())
  turnover     Float
  unit         String
  employees    Int
  sourceId     Int    @relation(fields: [sourceId], references: [id])
  fiscalYearId Int    @relation(fields: [fiscalYearId], references: [id])

  fiscalYear FiscalYear @relation(fields: [fiscalYearId], references: [id])
  source     Source     @relation(fields: [sourceId], references: [id])
}

model Goal {
  id          Int     @id @default(autoincrement())
  description String
  year        String?
  target      Float?
  baseYear    String
  companyId   Int     @relation(fields: [companyId], references: [id])

  company Company @relation(fields: [companyId], references: [id])
}

model Initiative {
  id          Int     @id @default(autoincrement())
  title       String
  description String
  year        String?
  scope       String
  companyId   Int     @relation(fields: [companyId], references: [id])

  company Company @relation(fields: [companyId], references: [id])
}

model Source {
  id          Int      @id @default(autoincrement())
  url         String?
  comment     String?
  userId      Int
  lastUpdated DateTime @default(now()) @updatedAt
}

// Since the enum values are represented as integers,
// we will be able to use that to determine which category it is
enum Scope3CategoryEnum {
  purchasedGoods
  capitalGoods
  fuelAndEnergyRelatedActivities
  upstreamTransportationAndDistribution
  wasteGeneratedInOperations
  businessTravel
  employeeCommuting
  upstreamLeasedAssets
  downstreamTransportationAndDistribution
  processingOfSoldProducts
  useOfSoldProducts
  endOfLifeTreatmentOfSoldProducts
  downstreamLeasedAssets
  franchises
  investments
  other
}
