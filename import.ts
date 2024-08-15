import { PrismaClient } from '@prisma/client'

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

const companies = await fetch('https://api.klimatkollen.se/api/companies').then(
  (res) => res.json()
)

companies.forEach((company) => {

  const gics = await prisma.industryGics.findFirstOrThrow({
    where: {
      subIndustryCode: company.industryGics.subIndustry.code,
    },
  })

  prisma.company.create({
    data: {
      name: company.companyName,
      description: company.description,
      wikidataId: company.wikidataId,
      industryGicsId: gics.id,
      emissions: {
        create: {
          year: company.emissions['2022'].year,
          scope1: {
            create: {
              emissions: company.emissions['2022'].scope1.emissions,
              biogenic: company.emissions['2022'].scope1.biogenic,
              verified: company.emissions['2022'].scope1.verified,
              unit: company.emissions['2022'].scope1.unit,
            },
          },
          scope2: {
            create: {
              emissions: company.emissions['2022'].scope2.emissions,
              biogenic: company.emissions['2022'].scope2.biogenic,
              verified: company.emissions['2022'].scope2.verified,
              unit: company.emissions['2022'].scope2.unit,
              mb: company.emissions['2022'].scope2.mb,
              lb: company.emissions['2022'].scope2.lb,
            },
          },
          scope3: {
            create: {
              emissions: company.emissions['2022'].scope3.emissions,

            },
          },
        }
    }
  }
})
