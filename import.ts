import { Prisma, PrismaClient } from '@prisma/client'

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

async function prepareEmissionUnits() {
  return {
    tCO2e: await prisma.emissionUnit.create({ data: { name: 'tCO2e' } }),
  }
}

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
  if (!code) return
  return (
    await prisma.industryGics.findUnique({
      where: {
        subIndustryCode: code,
      },
      select: {
        subIndustryCode: true,
      },
    })
  )?.subIndustryCode
}

async function main() {
  // INIT
  console.log('Resetting database and applying migrations...')
  await promisify(exec)('npx prisma migrate reset --force')

  const currencies = await prepareCurrencies(companies)
  await addIndustryGicsCodesToDB()
  const [user, alex] = await prisma.user.createManyAndReturn({
    data: [
      {
        email: 'hej@klimatkollen.se',
        name: 'Klimatkollen',
      },
      {
        email: 'alex@klimatkollen.se',
        name: 'Alexandra Palmquist',
      },
    ],
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
      updaterId: user.id,
      sources: {
        connect: [{ id: source.id }],
      },
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

  const EMISSION_UNITS = await prepareEmissionUnits()

  const tCO2e = EMISSION_UNITS.tCO2e

  async function createEmissionsForYear(
    year: string,
    company: (typeof companies)[number]
  ) {
    const emissions = company.emissions?.[year]
    if (!emissions) return null

    function createScope3Category(category: number, key: string) {
      return {
        category,
        total: emissions.scope3?.categories?.[key],
        unitId: tCO2e.id,
        metadataId: metadata.id,
      }
    }

    const biogenicEmissions:
      | Prisma.BiogenicEmissionsCreateNestedOneWithoutEmissionsInput
      | undefined = Number.isFinite(emissions.totalBiogenic)
      ? {
          create: {
            total: emissions.totalBiogenic,
            unitId: tCO2e.id,
            metadataId: 1,
          },
        }
      : undefined

    const statedTotalScope3Emissions:
      | Prisma.StatedTotalEmissionsUncheckedCreateNestedOneWithoutScope3Input
      | undefined = Number.isFinite(emissions.scope3?.emissions)
      ? {
          create: {
            total: Number(emissions.scope3?.emissions ?? 0),
            unitId: tCO2e.id,
            metadataId: 1,
          },
        }
      : undefined

    const { id } = await prisma.emissions.create({
      data: {
        biogenicEmissions,
        scope1: {
          create: {
            total: emissions.scope1?.emissions || null,
            unitId: tCO2e.id,
            metadataId: 1,
          },
        },
        scope2: {
          create: {
            mb: emissions.scope2?.mb || null,
            lb: emissions.scope2?.lb || null,
            unknown: emissions.scope2?.emissions || null,
            unitId: tCO2e.id,
            metadataId: 1,
          },
        },

        // TODO: handle import for scope1And2
        // TODO: Add scope1And2 to the API response and calculations if it exists. Ignore if scope 1 and scope 2 have been added separately.
        scope3: {
          create: {
            statedTotalEmissions: statedTotalScope3Emissions,
            scope3Categories: {
              createMany: {
                data: [
                  '1_purchasedGoods',
                  '2_capitalGoods',
                  '3_fuelAndEnergyRelatedActivities',
                  '4_upstreamTransportationAndDistribution',
                  '5_wasteGeneratedInOperations',
                  '6_businessTravel',
                  '7_employeeCommuting',
                  '8_upstreamLeasedAssets',
                  '9_downstreamTransportationAndDistribution',
                  '10_processingOfSoldProducts',
                  '11_useOfSoldProducts',
                  '12_endOfLifeTreatmentOfSoldProducts',
                  '13_downstreamLeasedAssets',
                  '14_franchises',
                  '15_investments',
                  '16_other',
                ].map((key) =>
                  createScope3Category(parseInt(key.split('_')?.[0]), key)
                ),
              },
            },
            metadataId: 1,
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
        industry: gicsCode
          ? {
              create: {
                gicsSubIndustryCode: gicsCode,
                metadataId: metadata.id,
              },
            }
          : undefined,
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
