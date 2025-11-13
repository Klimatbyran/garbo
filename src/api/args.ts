import { Prisma } from '@prisma/client'
import { TurnoverSchema } from './schemas'

export const emissionsArgs = {
  include: {
    scope1: { select: { id: true } },
    scope2: { select: { id: true } },
    scope3: { select: { id: true } },
    biogenicEmissions: { select: { id: true } },
    scope1And2: { select: { id: true } },
    statedTotalEmissions: { select: { id: true } },
  },
} satisfies Prisma.EmissionsDefaultArgs

export const economyArgs = {
  include: {
    employees: { select: { id: true } },
    turnover: { select: { id: true } },
  },
} satisfies Prisma.EconomyDefaultArgs

export const reportingPeriodArgs = {
  include: {
    emissions: emissionsArgs,
    economy: economyArgs,
    company: { select: { wikidataId: true } },
  },
} satisfies Prisma.ReportingPeriodDefaultArgs

export const metadataArgs = {
  orderBy: {
    updatedAt: 'desc' as const,
  },
  take: 1,
  select: {
    id: true,
    comment: true,
    source: true,
    updatedAt: true,
    user: {
      select: {
        name: true,
      },
    },
    verifiedBy: {
      select: {
        name: true,
      },
    },
  } satisfies Prisma.MetadataDefaultArgs['select'],
}

const minimalMetadataArgs = {
  orderBy: {
    updatedAt: 'desc' as const,
  },
  take: 1,
  select: {
    verifiedBy: {
      select: {
        name: true,
      },
    },
  },
}

export const detailedCompanyArgs = {
  select: {
    wikidataId: true,
    name: true,
    logoUrl: true,
    description: true,
    descriptions: {
      select: {
        id: true,
        text: true,
        language: true,
      },
    },
    lei: true,
    reportingPeriods: {
      select: {
        id: true,
        startDate: true,
        endDate: true,
        reportURL: true,
        economy: {
          select: {
            id: true,
            turnover: {
              select: {
                id: true,
                value: true,
                currency: true,
                metadata: metadataArgs,
              },
            },
            employees: {
              select: {
                id: true,
                value: true,
                unit: true,
                metadata: metadataArgs,
              },
            },
          },
        },
        emissions: {
          select: {
            id: true,
            scope1: {
              select: {
                id: true,
                total: true,
                unit: true,
                metadata: metadataArgs,
              },
            },
            scope2: {
              select: {
                id: true,
                lb: true,
                mb: true,
                unknown: true,
                unit: true,
                metadata: metadataArgs,
              },
            },
            scope3: {
              select: {
                id: true,
                statedTotalEmissions: {
                  select: {
                    id: true,
                    total: true,
                    unit: true,
                    metadata: metadataArgs,
                  },
                },
                categories: {
                  select: {
                    id: true,
                    category: true,
                    total: true,
                    unit: true,
                    metadata: metadataArgs,
                  },
                  orderBy: {
                    category: 'asc',
                  },
                },
                metadata: metadataArgs,
              },
            },
            biogenicEmissions: {
              select: {
                id: true,
                total: true,
                unit: true,
                metadata: metadataArgs,
              },
            },
            scope1And2: {
              select: {
                id: true,
                total: true,
                unit: true,
                metadata: metadataArgs,
              },
            },
            statedTotalEmissions: {
              select: {
                id: true,
                total: true,
                unit: true,
                metadata: metadataArgs,
              },
            },
          },
        },
        metadata: metadataArgs,
      },
      orderBy: {
        startDate: 'desc',
      },
    },
    industry: {
      select: {
        id: true,
        industryGics: {
          select: {
            sectorCode: true,
            groupCode: true,
            industryCode: true,
            subIndustryCode: true,
          },
        },
        metadata: metadataArgs,
      },
    },
    goals: {
      select: {
        id: true,
        description: true,
        year: true,
        baseYear: true,
        target: true,
        metadata: metadataArgs,
      },
      orderBy: {
        year: 'desc',
      },
    },
    initiatives: {
      select: {
        id: true,
        title: true,
        description: true,
        year: true,
        scope: true,
        metadata: metadataArgs,
      },
      orderBy: {
        year: 'desc',
      },
    },
    baseYear: {
      select: { id: true, year: true, metadata: metadataArgs },
    },
  },
} satisfies Prisma.CompanyDefaultArgs

export const companyListArgs = {
  select: {
    wikidataId: true,
    name: true,
    logoUrl: true,
    description: true,
    descriptions: {
      select: {
        id: true,
        language: true,
        text: true,
      },
    },
    lei: true,
    baseYear: {
      select: { id: true, year: true, metadata: metadataArgs },
    },
    tags: true,
    reportingPeriods: {
      select: {
        startDate: true,
        endDate: true,
        reportURL: true,
        economy: {
          select: {
            turnover: {
              select: {
                value: true,
                currency: true,
                metadata: minimalMetadataArgs,
              },
            },
            employees: {
              select: {
                value: true,
                unit: true,
                metadata: minimalMetadataArgs,
              },
            },
          },
        },
        emissions: {
          select: {
            scope1: {
              select: {
                total: true,
                unit: true,
                metadata: minimalMetadataArgs,
              },
            },
            scope2: {
              select: {
                lb: true,
                mb: true,
                unknown: true,
                unit: true,
                metadata: minimalMetadataArgs,
              },
            },
            scope3: {
              select: {
                statedTotalEmissions: {
                  select: {
                    total: true,
                    unit: true,
                    metadata: minimalMetadataArgs,
                  },
                },
                categories: {
                  select: {
                    category: true,
                    total: true,
                    unit: true,
                    metadata: minimalMetadataArgs,
                  },
                  orderBy: {
                    category: 'asc',
                  },
                },
                metadata: minimalMetadataArgs,
              },
            },
            scope1And2: {
              select: {
                total: true,
                unit: true,
                metadata: minimalMetadataArgs,
              },
            },
            statedTotalEmissions: {
              select: {
                total: true,
                unit: true,
                metadata: minimalMetadataArgs,
              },
            },
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    },
    industry: {
      select: {
        industryGics: {
          select: {
            sectorCode: true,
            groupCode: true,
            industryCode: true,
            subIndustryCode: true,
          },
        },
        metadata: minimalMetadataArgs,
      },
    },
  },
} satisfies Prisma.CompanyDefaultArgs

export const companyExportArgs = (year?) => {
  return {
    select: {
      wikidataId: true,
      name: true,
      description: true,
      descriptions: {
        select: {
          language: true,
          text: true,
        },
      },
      baseYear: {
        select: { id: true, year: true },
      },
      tags: true,
      reportingPeriods: {
        select: {
          startDate: true,
          endDate: true,
          reportURL: true,
          economy: {
            select: {
              turnover: {
                select: {
                  value: true,
                  currency: true,
                },
              },
              employees: {
                select: {
                  value: true,
                  unit: true,
                },
              },
            },
          },
          emissions: {
            select: {
              scope1: {
                select: {
                  total: true,
                  unit: true,
                },
              },
              scope2: {
                select: {
                  lb: true,
                  mb: true,
                  unknown: true,
                  unit: true,
                },
              },
              scope3: {
                select: {
                  statedTotalEmissions: {
                    select: {
                      total: true,
                      unit: true,
                    },
                  },
                  categories: {
                    select: {
                      category: true,
                      total: true,
                      unit: true,
                    },
                    orderBy: {
                      category: 'asc',
                    },
                  },
                },
              },
              scope1And2: {
                select: {
                  total: true,
                  unit: true,
                },
              },
              statedTotalEmissions: {
                select: {
                  total: true,
                  unit: true,
                },
              },
            },
          },
        },
        ...(year && {
          where: {
            endDate: {
              lte: new Date(`${year}-12-31`),
              gte: new Date(`${year}-01-01`),
            },
          },
        }),
        orderBy: {
          startDate: 'desc',
        },
      },
      industry: {
        select: {
          industryGics: {
            select: {
              sectorCode: true,
              groupCode: true,
              industryCode: true,
              subIndustryCode: true,
            },
          },
        },
      },
    },
  } satisfies Prisma.CompanyDefaultArgs
}
