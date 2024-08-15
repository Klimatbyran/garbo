model Company {
  id             Int           @id @default(autoincrement())
  companyName    String
  description    String
  wikidataId     String
  industryGicsId Int           @relation(fields: [industryGicsId], references: [id])
  industryNaceId Int?          @relation(fields: [industryNaceId], references: [id])
  url            String
  fiscalYears    FiscalYear[]

  industryGics   IndustryGics  @relation(fields: [industryGicsId], references: [id])
  industryNace   IndustryNace? @relation(fields: [industryNaceId], references: [id])
}

model IndustryGics {
  id               Int        @id @default(autoincrement())
  name             String
  sectorCode       String
  sectorName       String
  groupCode        String
  groupName        String
  industryCode     String
  industryName     String
  subIndustryCode  String
  subIndustryName  String
  companies        Company[]
}

model IndustryNace {
  id               Int        @id @default(autoincrement())
  sectionCode      String
  sectionName      String
  divisionCode     String
  divisionName     String
  companies        Company[]
}

model FiscalYear {
  id           Int           @id @default(autoincrement())
  year         String
  companyId    Int           @relation(fields: [companyId], references: [id])
  emissions    Emission?
  economy      Economy?
  
  company      Company       @relation(fields: [companyId], references: [id])
}

model Emission {
  id            Int           @id @default(autoincrement())
  scope1Id      Int           @relation(fields: [scope1Id], references: [id])
  scope2Id      Int           @relation(fields: [scope2Id], references: [id])
  scope3Id      Int           @relation(fields: [scope3Id], references: [id])
  fiscalYearId  Int           @relation(fields: [fiscalYearId], references: [id])

  scope1        Scope1
  scope2        Scope2
  scope3        Scope3

  fiscalYear    FiscalYear    @relation(fields: [fiscalYearId], references: [id])
}

model Scope1 {
  id        Int      @id @default(autoincrement())
  emissions Float
  biogenic  Float?
  unit      String
  baseYear  String
  sourceId  Int      @relation(fields: [sourceId], references: [id])

  source    Source   @relation(fields: [sourceId], references: [id])
}

model Scope2 {
  id        Int      @id @default(autoincrement())
  emissions Float
  biogenic  Float?
  unit      String
  mb        Float?
  lb        Float?
  baseYear  String
  sourceId  Int      @relation(fields: [sourceId], references: [id])

  source    Source   @relation(fields: [sourceId], references: [id])
}

model Scope3 {
  id        Int      @id @default(autoincrement())
  emissions Float?
  biogenic  Float?
  unit      String
  baseYear  String
  sourceId  Int      @relation(fields: [sourceId], references: [id])

  categories Scope3Category[]

  source    Source   @relation(fields: [sourceId], references: [id])
}

model Scope3Category {
  id            Int              @id @default(autoincrement())
  category      Scope3CategoryEnum
  emissions     Float?
  scope3Id      Int              @relation(fields: [scope3Id], references: [id])
  sourceId      Int              @relation(fields: [sourceId], references: [id])

  scope3        Scope3           @relation(fields: [scope3Id], references: [id])
  source        Source           @relation(fields: [sourceId], references: [id])
}

model Economy {
  id           Int           @id @default(autoincrement())
  turnover     Float
  unit         String
  employees    Int
  sourceId     Int           @relation(fields: [sourceId], references: [id])
  fiscalYearId Int           @relation(fields: [fiscalYearId], references: [id])

  fiscalYear   FiscalYear    @relation(fields: [fiscalYearId], references: [id])
  source       Source        @relation(fields: [sourceId], references: [id])
}

model Goal {
  id          Int     @id @default(autoincrement())
  description String
  year        String?
  target      Float?
  baseYear    String
  companyId   Int     @relation(fields: [companyId], references: [id])

  company     Company @relation(fields: [companyId], references: [id])
}

model Initiative {
  id          Int     @id @default(autoincrement())
  title       String
  description String
  year        String?
  scope       String
  companyId   Int     @relation(fields: [companyId], references: [id])

  company     Company @relation(fields: [companyId], references: [id])
}

model Wikidata {
  id          Int      @id @default(autoincrement())
  node        String
  url         String
  logo        String
  label       String
  description String
  emissions   Json[]
}

model Source {
  id         Int      @id @default(autoincrement())
  url        String?
  comment    String?
  userId     Int
  lastUpdated DateTime @default(now())
}

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
