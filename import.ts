import { Currency, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/*
{
    "companyName": "Samhällsbyggnadsbolaget i Norden AB",
    "description": "SBB, eller Samhällsbyggnadsbolaget i Norden AB, är ett ledande fastighetsbolag i Norden med fokus på samhällsfastigheter och bostäder. Företaget arbetar med att förvärva, utveckla och förvalta fastigheter som bidrar till samhällsnytta, såsom skolor, vårdcentraler och äldreboenden. SBB strävar efter att vara en långsiktig och hållbar aktör inom fastighetssektorn och har en stark betoning på social och miljömässig hållbarhet.",
    "wikidataId": "Q93559269",
    "industryGics": {
      "name": "Fastighetsinvesteringsbolag (REITs)",
      "sector": {
        "code": "60",
        "name": "Finans och fastighet"
      },
      "group": {
        "code": "6010",
        "name": "Fastighetsinvesteringsbolag (REITs)"
      },
      "industry": {
        "code": "601060",
        "name": "Bostads-REITs"
      },
      "subIndustry": {
        "code": "60106010",
        "name": "Flerfamiljs-REITs"
      }
    },
    "industryNace": {
      "section": {
        "code": "M",
        "name": "Real estate activities"
      },
      "division": {
        "code": "68",
        "name": "Real estate activities"
      }
    },
    "url": "https://corporate.sbbnorden.se/sv/wp-content/uploads/sites/3/2020/04/sbb-hallbarhetsrapport-2023.pdf",
    "emissions": {
      "2022": {
        "year": "2022",
        "scope1": {
          "emissions": 1350,
          "biogenic": null,
          "verified": null,
          "unit": "tCO2e"
        },
        "scope2": {
          "emissions": 13748,
          "biogenic": null,
          "verified": null,
          "unit": "tCO2e",
          "mb": 13748,
          "lb": 19105
        },
        "scope3": {
          "emissions": 35763,
          "verified": null,
          "biogenic": null,
          "unit": "tCO2e",
          "categories": {
            "2_capitalGoods": 17100,
            "3_fuelAndEnergyRelatedActivities": 1529,
            "4_upstreamTransportationAndDistribution": 2496,
            "5_wasteGeneratedInOperations": 1066,
            "6_businessTravel": 35,
            "8_upstreamLeasedAssets": 14,
            "13_downstreamLeasedAssets": 12406,
            "16_other": 1116
          }
        }
      },
      "2023": {
        "year": "2023",
        "scope1": {
          "emissions": 988,
          "biogenic": null,
          "verified": null,
          "unit": "tCO2e"
        },
        "scope2": {
          "emissions": 9468,
          "biogenic": null,
          "verified": null,
          "unit": "tCO2e",
          "mb": 9468,
          "lb": 17381
        },
        "scope3": {
          "emissions": 31719,
          "verified": null,
          "biogenic": null,
          "unit": "tCO2e",
          "categories": {
            "2_capitalGoods": 14213,
            "3_fuelAndEnergyRelatedActivities": 1292,
            "4_upstreamTransportationAndDistribution": 1983,
            "5_wasteGeneratedInOperations": 942,
            "6_businessTravel": 43,
            "8_upstreamLeasedAssets": 10,
            "13_downstreamLeasedAssets": 12500,
            "16_other": 738
          }
        }
      }
    },
    "baseFacts": {
      "2021": {
        "turnover": 12345,
        "unit": "SEK",
        "employees": 289
      },
      "2022": {
        "turnover": 12345,
        "unit": "SEK",
        "employees": 388
      },
      "2023": {
        "turnover": 12345,
        "unit": "SEK",
        "employees": 303
      }
    },
    "goals": [
      {
        "description": "Minska utsläpp i Scope 1–2 med 25 procent till år 2025 och 60 procent till år 2030 jämfört med basår 2020.",
        "year": "2030",
        "target": 60,
        "baseYear": "2020"
      },
      {
        "description": "Minska utsläppen i Scope 3 med 30 procent till 2025 och med 60 procent till år 2030 jämfört med basår 2020.",
        "year": "2030",
        "target": 60,
        "baseYear": "2020"
      },
      {
        "description": "Minska energianvändningen med fem procent per år i jämförbart bestånd.",
        "year": null,
        "target": 5,
        "baseYear": null
      }
    ],
    "initiatives": [
      {
        "title": "Minska energianvändningen och öka andelen förnybar energi",
        "description": "SBB har som mål att minska energianvändningen med fem procent per år i jämförbart bestånd och öka andelen förnybar energi.",
        "year": "2023",
        "scope": "scope1"
      },
      {
        "title": "Minska koldioxidutsläpp",
        "description": "SBB har satt upp mål att minska utsläpp i Scope 1–2 med 25 procent till år 2025 och 60 procent till år 2030 jämfört med basår 2020.",
        "year": "2025",
        "scope": "scope1-2"
      },
      {
        "title": "Öka produktionen av förnybar el",
        "description": "SBB har under 2023 driftsatt en solelspark som väntas bidra med 10 GWh förnybar el per år.",
        "year": "2023",
        "scope": "scope2"
      }
    ],
    "wikidata": {
      "node": "Q93559269",
      "url": "https://www.wikidata.org/wiki/Q93559269",
      "logo": "https://commons.wikimedia.org/wiki/File:Example.jpg",
      "label": "Samhällsbyggnadsbolaget i Norden AB",
      "description": "fastighetsbolag i Sverige",
      "emissions": [
        {
          "year": "2023",
          "reference": "https://corporate.sbbnorden.se/sv/wp-content/uploads/sites/3/2020/04/sbb-hallbarhetsrapport-2023.pdf",
          "scope1": {
            "emissions": 988,
            "biogenic": null,
            "unit": "tCO2e",
            "verified": null
          },
          "scope2": {
            "emissions": 9468,
            "biogenic": null,
            "unit": "tCO2e",
            "mb": null,
            "lb": null,
            "verified": null
          },
          "scope3": {
            "emissions": 31719,
            "unit": "tCO2e",
            "baseYear": null,
            "verified": null,
            "categories": {
              "2_capitalGoods": 14213,
              "3_fuelAndEnergyRelatedActivities": 1292,
              "4_upstreamTransportationAndDistribution": 1983,
              "5_wasteGeneratedInOperations": 942,
              "6_businessTravel": 43.02,
              "7_employeeCommuting": null,
              "8_upstreamLeasedAssets": 10,
              "9_downstreamTransportationAndDistribution": null,
              "10_processingOfSoldProducts": null,
              "11_useOfSoldProducts": null,
              "12_endOfLifeTreatmentOfSoldProducts": null,
              "13_downstreamLeasedAssets": 12500,
              "14_franchises": null,
              "15_investments": null,
              "16_other": 738
            }
          }
        }
      ]
    },
    "reliability": "High",
    "needsReview": false,
    "reviewComment": "Allt ser bra ut!",
    "facit": {
      "companyName": "SBB",
      "url": "https://corporate.sbbnorden.se/sv/wp-content/uploads/sites/3/2020/04/sbb-hallbarhetsrapport-2023.pdf",
      "emissions": {
        "2023": {
          "year": "2023",
          "scope1": {
            "emissions": 988
          },
          "scope2": {
            "lb": 17381,
            "mb": 9468,
            "emissions": 9468
          },
          "scope3": {
            "emissions": 31719,
            "categories": {
              "1_purchasedGoods": 2493,
              "2_capitalGoods": 14213,
              "3_fuelAndEnergyRelatedActivities": 1292,
              "4_upstreamTransportationAndDistribution": 1983,
              "5_wasteGeneratedInOperations": 942,
              "6_businessTravel": 43.02,
              "7_employeeCommuting": null,
              "8_upstreamLeasedAssets": 10,
              "9_downstreamTransportationAndDistribution": null,
              "10_processingOfSoldProducts": null,
              "11_useOfSoldProducts": null,
              "12_endOfLifeTreatmentOfSoldProducts": null,
              "13_downstreamLeasedAssets": 12500,
              "14_franchises": null,
              "15_investments": null,
              "16_other": 738
            }
          },
          "totalBiogenic": 80
        }
      }
    },
    "confidenceScore": 95,
    "agentResponse": "Tack för att du tillhandahöll den nya informationen. Jag har uppdaterat Scope 1-utsläppen för 2023 till 988 ton CO2e och tagit bort kategori 1 från Scope 3. Om du har ytterligare information eller behöver fler justeringar, vänligen meddela mig.",
    "timestamp": "2024-07-04T11:36:28.335Z",
    "state": "approved"
  },

  */

import companies from './companies.json'
import { addIndustryGicsCodesToDB } from './scripts/add-gics'
import { promisify } from 'util'
import { exec } from 'child_process'

async function prepareCurrencies(allCompanies: typeof companies) {
  const uniqueCurrencies = new Set<string>()

  for (const company of allCompanies) {
    for (const [year, baseFacts] of Object.entries(company.baseFacts ?? {})) {
      if (baseFacts?.unit) {
        const currency = baseFacts.unit.toUpperCase()
        uniqueCurrencies.add(currency)
      }
    }
  }

  return prisma.currency.createManyAndReturn({
    data: [...uniqueCurrencies].map((name) => ({ name })),
  })
}

function getFirstDefinedValue(...values: (string | null | undefined)[]) {
  for (const value of values) {
    if (value && value.length) {
      return value
    }
  }
}

function getName(company: (typeof companies)[number]) {
  let name = getFirstDefinedValue(
    company.facit?.companyName,
    company.wikidata?.label,
    company.companyName
  )
  if (!name) {
    throw new Error('name missing for ' + JSON.stringify(company, null, 2))
  }

  return name
}

function getWikidataId(company: (typeof companies)[number]) {
  let wikidataId = getFirstDefinedValue(
    company.wikidata?.node,
    company.wikidataId
  )
  if (!wikidataId) {
    throw new Error('wikidataId missing for ' + getName(company))
  }

  return wikidataId
}

async function getGicsCode(company: (typeof companies)[number]) {
  const code = company.industryGics?.subIndustry?.code
  if (!code) {
    return
  }
  return (
    await prisma.industryGics.findUnique({
      where: {
        subIndustryCode: code,
      },
    })
  )?.subIndustryCode
}

async function main() {
  // INIT
  // Delete database first and apply all migrations
  await promisify(exec)('npx prisma migrate reset --force')

  const currencies = await prepareCurrencies(companies)
  await addIndustryGicsCodesToDB()
  const user = await prisma.user.create({
    data: {
      email: 'hej@klimatkollen.se',
      name: 'Klimatkollen',
    },
  })

  // TODO: properly create sources for all unique report URLs
  const source = await prisma.source.create({
    data: {
      comment: 'Garbo import',
      url: 'https://klimatkollen.se',
    },
  })

  // TODO: properly create metadata for every datapoint
  const metadata = await prisma.metadata.create({
    data: {
      comment: 'Initial import',
      updatedAt: new Date(),
      userId: user.id,
      sourceId: source.id,
      dataOrigin: {
        create: {
          name: 'Garbo extraction',
        },
      },
    },
  })

  async function createEconomy(economy) {
    // if the currency exists, use it, otherwise create it

    const currencyId = economy.currency
      ? currencies.find((c) => c.name === economy.currency.toUpperCase())?.id
      : null

    const { id } = await prisma.economy.create({
      data: {
        turnover: economy.turnover,
        employees: economy.employees,
        // TODO: Add employeesUnit when importing the facit data
        currencyId,
        metadataId: metadata.id,
      },
      select: {
        id: true,
      },
    })

    return id
  }

  const tCO2e = 'tCO2e'

  async function createEmissionsForYear(
    year: string,
    company: (typeof companies)[number]
  ) {
    const emissions = company.emissions?.[year]
    if (!emissions) {
      return null
    }

    const { id } = await prisma.emissions.create({
      data: {
        biogenicEmissions: {
          create: {
            total: emissions.totalBiogenic || null,
            unit: tCO2e,
            metadataId: 1,
          },
        },
        scope1: {
          create: {
            total: emissions.scope1?.emissions || null,
            unit: tCO2e,
            metadataId: 1,
          },
        },
        scope2: {
          create: {
            mb: emissions.scope2?.mb || null,
            lb: emissions.scope2?.lb || null,
            unknown: emissions.scope2?.emissions || null,
            unit: tCO2e,
            metadataId: 1,
          },
        },
        scope3: {
          create: {
            //total: emissions.scope3?.emissions || null,
            c1_purchasedGoods:
              emissions.scope3?.categories?.['1_purchasedGoods'],
            c2_capitalGoods: emissions.scope3?.categories?.['2_capitalGoods'],
            c3_fuelAndEnergyRelatedActivities:
              emissions.scope3?.categories?.[
                '3_fuelAndEnergyRelatedActivities'
              ],
            c4_upstreamTransportationAndDistribution:
              emissions.scope3?.categories?.[
                '4_upstreamTransportationAndDistribution'
              ],
            c5_wasteGeneratedInOperations:
              emissions.scope3?.categories?.['5_wasteGeneratedInOperations'],
            c6_businessTravel:
              emissions.scope3?.categories?.['6_businessTravel'],
            c7_employeeCommuting:
              emissions.scope3?.categories?.['7_employeeCommuting'],
            c8_upstreamLeasedAssets:
              emissions.scope3?.categories?.['8_upstreamLeasedAssets'],
            c9_downstreamTransportationAndDistribution:
              emissions.scope3?.categories?.[
                '9_downstreamTransportationAndDistribution'
              ],
            c10_processingOfSoldProducts:
              emissions.scope3?.categories?.['10_processingOfSoldProducts'],
            c11_useOfSoldProducts:
              emissions.scope3?.categories?.['11_useOfSoldProducts'],
            c12_endOfLifeTreatmentOfSoldProducts:
              emissions.scope3?.categories?.[
                '12_endOfLifeTreatmentOfSoldProducts'
              ],
            c13_downstreamLeasedAssets:
              emissions.scope3?.categories?.['13_downstreamLeasedAssets'],
            c14_franchises: emissions.scope3?.categories?.['14_franchises'],
            c15_investments: emissions.scope3?.categories?.['15_investments'],
            other: emissions.scope3?.categories?.['16_other'],
            metadataId: 1,
            unit: tCO2e,
          },
        },
      },
      select: {
        id: true,
      },
    })

    return id
  }

  // IMPORT
  for (const company of companies) {
    const gicsCode = await getGicsCode(company)
    console.log(gicsCode, getName(company))

    const years = [
      ...new Set([
        ...Object.keys(company.baseFacts ?? {}),
        ...Object.keys(company.emissions ?? {}),
      ]),
    ]

    const added = await prisma.company.create({
      data: {
        name: getName(company),
        description: company.description,
        wikidataId: getWikidataId(company),
        industryGicsCode: gicsCode || undefined,
        initiatives: Array.isArray(company.initiatives)
          ? {
              createMany: {
                data: company.initiatives.map(
                  (initiative: (typeof company.initiatives)[number]) => ({
                    title: initiative.title,
                    description: initiative.description,
                    year: initiative.year,
                    scope: Array.isArray(initiative.scope)
                      ? initiative.scope.join(',')
                      : initiative.scope,
                    metadataId: metadata.id,
                  })
                ),
              },
            }
          : undefined,
        goals: Array.isArray(company.goals)
          ? {
              createMany: {
                data: company.goals.map(
                  (goal: (typeof company.goals)[number]) => ({
                    description: goal.description,
                    year: goal.year?.toString() || null,
                    target: goal.target,
                    baseYear: goal.baseYear,
                    metadataId: metadata.id,
                  })
                ),
              },
            }
          : undefined,

        reportingPeriods:
          company.baseFacts || company.emissions
            ? {
                createMany: {
                  data: await Promise.all(
                    years.map(async (year) => {
                      const {
                        turnover,
                        employees,
                        unit: currency,
                      } = company.baseFacts?.[year] ?? {
                        turnover: null,
                        employees: null,
                        unit: null,
                      }
                      return {
                        startDate: new Date(`${year}-01-01`),
                        endDate: new Date(`${year}-12-31`),
                        economyId: await createEconomy({
                          turnover: turnover ? parseFloat(turnover) : null,
                          employees,
                          currency: currency || null,
                        }),
                        emissionsId: await createEmissionsForYear(
                          year,
                          company
                        ),
                        metadataId: metadata.id,
                      }
                    })
                  ),
                },
              }
            : undefined,
      },
    })
  }
}

await main()
// companies.deleteAll()
