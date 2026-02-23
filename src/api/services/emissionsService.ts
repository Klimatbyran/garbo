import {
  BiogenicEmissions,
  Metadata,
  Scope1,
  Scope1And2,
  Scope3,
  Scope3Category,
  StatedTotalEmissions,
} from '@prisma/client'
import { OptionalNullable } from '../../lib/type-utils'
import { DefaultEmissions } from '../types'
import { prisma } from '../../lib/prisma'
import { emissionsArgs } from '../args'
import _ from 'lodash'

class EmissionsService {
  async upsertEmissions({
    emissionsId,
    reportingPeriodId,
  }: {
    emissionsId: string
    reportingPeriodId: string
  }) {
    return prisma.emissions.upsert({
      where: { id: emissionsId },
      update: {},
      create: {
        reportingPeriod: {
          connect: {
            id: reportingPeriodId,
          },
        },
      },
      ...emissionsArgs,
    })
  }

  async upsertScope1(
    emissions: DefaultEmissions,
    scope1: Omit<Scope1, 'id' | 'metadataId' | 'emissionsId'>,
    metadata: Metadata,
  ) {
    const existingScope1Id = emissions.scope1?.id

    return existingScope1Id
      ? prisma.scope1.update({
          where: { id: existingScope1Id },
          data: {
            ...scope1,
            metadata: {
              connect: {
                id: metadata.id,
              },
            },
          },
          select: { id: true },
        })
      : prisma.scope1.create({
          data: {
            ...scope1,
            metadata: {
              connect: {
                id: metadata.id,
              },
            },
            emissions: {
              connect: {
                id: emissions.id,
              },
            },
          },
          select: { id: true },
        })
  }

  async deleteScope1(id: Scope1['id']) {
    return await prisma.scope1.delete({ where: { id } })
  }

  async upsertScope2(
    emissions: DefaultEmissions,
    scope2: {
      lb?: number | null
      mb?: number | null
      unknown?: number | null
      unit: 'tCO2e' | 'tCO2'
    },
    metadata: Metadata,
  ) {
    const existingScope2Id = emissions.scope2?.id

    return existingScope2Id
      ? prisma.scope2.update({
          where: { id: existingScope2Id },
          data: {
            ...scope2,
            metadata: {
              connect: {
                id: metadata.id,
              },
            },
          },
          select: { id: true },
        })
      : prisma.scope2.create({
          data: {
            ...scope2,
            metadata: {
              connect: {
                id: metadata.id,
              },
            },
            emissions: {
              connect: {
                id: emissions.id,
              },
            },
          },
          select: { id: true },
        })
  }

  async deleteScope2(id: string) {
    return await prisma.scope2.delete({ where: { id } })
  }

  async upsertScope1And2(
    emissions: DefaultEmissions,
    scope1And2: Omit<Scope1And2, 'id' | 'metadataId' | 'emissionsId'>,
    metadata: Metadata,
  ) {
    const existingScope1And2Id = emissions.scope1And2?.id

    return existingScope1And2Id
      ? prisma.scope1And2.update({
          where: { id: existingScope1And2Id },
          data: {
            ...scope1And2,
            metadata: {
              connect: {
                id: metadata.id,
              },
            },
          },
          select: { id: true },
        })
      : prisma.scope1And2.create({
          data: {
            ...scope1And2,
            metadata: {
              connect: {
                id: metadata.id,
              },
            },
            emissions: {
              connect: {
                id: emissions.id,
              },
            },
          },
          select: { id: true },
        })
  }

  async deleteScope1And2(id: Scope1And2['id']) {
    return await prisma.scope1And2.delete({ where: { id } })
  }

  async upsertScope3(
    emissions: DefaultEmissions,
    scope3: {
      categories?: {
        category: number
        total: number | null
        unit: string | null
        verified?: boolean
      }[]
      statedTotalEmissions?: Omit<
        StatedTotalEmissions,
        'id' | 'metadataId' | 'scope3Id' | 'emissionsId'
      >
    },
    createMetadata: (verified: boolean) => Promise<Metadata>,
  ) {
    const existingScope3Id = emissions.scope3?.id

    const metadata = await createMetadata(
      'verified' in (scope3.statedTotalEmissions ?? {})
        ? (scope3.statedTotalEmissions as any).verified
        : false,
    )

    const updatedScope3 = await prisma.scope3.upsert({
      where: { id: existingScope3Id ?? '' },
      update: {},
      create: {
        metadata: {
          connect: {
            id: metadata.id,
          },
        },
        emissions: {
          connect: {
            id: emissions.id,
          },
        },
      },
      include: {
        statedTotalEmissions: { select: { id: true } },
        categories: {
          select: {
            id: true,
            category: true,
            total: true,
          },
        },
      },
    })
    const seenCategories = new Set<number>()
    scope3.categories = scope3.categories?.filter((item) => {
      if (seenCategories.has(item.category)) {
        return false
      }
      seenCategories.add(item.category)
      return true
    })
    await Promise.all(
      (scope3.categories ?? []).map(async (scope3Category) => {
        const metadataForScope3Category = await createMetadata(
          scope3Category.verified ?? false,
        )
        scope3Category = _.omit(scope3Category, 'verified')
        const matching = updatedScope3.categories.find(
          ({ category }) => scope3Category.category === category,
        )

        return prisma.scope3Category.upsert({
          where: {
            id: matching?.id ?? '',
          },
          update: {
            ...scope3Category,
            metadata: {
              connect: {
                id: metadataForScope3Category.id,
              },
            },
          },
          create: {
            ...scope3Category,
            scope3: {
              connect: {
                id: updatedScope3.id,
              },
            },
            metadata: {
              connect: {
                id: metadataForScope3Category.id,
              },
            },
          },
          select: { id: true },
        })
      }),
    )

    if (scope3.statedTotalEmissions) {
      await this.upsertStatedTotalEmissions(
        emissions,
        metadata,
        _.omit(scope3.statedTotalEmissions, 'verified'),
        updatedScope3,
      )
    }
  }

  async deleteScope3(id: Scope3['id']) {
    return await prisma.scope3.delete({ where: { id } })
  }

  async deleteScope3Category(id: Scope3Category['id']) {
    return await prisma.scope3Category.delete({ where: { id } })
  }

  async upsertBiogenic(
    emissions: DefaultEmissions,
    biogenic: OptionalNullable<
      Omit<BiogenicEmissions, 'id' | 'metadataId' | 'emissionsId'>
    >,
    metadata: Metadata,
  ) {
    const existingBiogenicEmissionsId = emissions.biogenicEmissions?.id

    return existingBiogenicEmissionsId
      ? await prisma.biogenicEmissions.update({
          where: {
            id: existingBiogenicEmissionsId,
          },
          data: {
            ...biogenic,
            metadata: {
              connect: {
                id: metadata.id,
              },
            },
          },
          select: { id: true },
        })
      : await prisma.biogenicEmissions.create({
          data: {
            ...biogenic,
            metadata: {
              connect: {
                id: metadata.id,
              },
            },
            emissions: {
              connect: {
                id: emissions.id,
              },
            },
          },
          select: { id: true },
        })
  }

  async deleteBiogenicEmissions(id: BiogenicEmissions['id']) {
    return await prisma.biogenicEmissions.delete({ where: { id } })
  }

  async upsertStatedTotalEmissions(
    emissions: DefaultEmissions,
    metadata: Metadata,
    statedTotalEmissions: Omit<
      StatedTotalEmissions,
      'id' | 'metadataId' | 'scope3Id' | 'emissionsId'
    >,
    scope3?: Scope3 & { statedTotalEmissions: { id: string } | null },
  ) {
    const statedTotalEmissionsId = scope3
      ? scope3.statedTotalEmissionsId || scope3?.statedTotalEmissions?.id
      : emissions.statedTotalEmissions?.id

    return prisma.statedTotalEmissions.upsert({
      where: { id: statedTotalEmissionsId ?? '' },
      create: {
        ...statedTotalEmissions,
        emissions: scope3
          ? undefined
          : {
              connect: { id: emissions.id },
            },
        scope3: scope3
          ? {
              connect: { id: scope3.id },
            }
          : undefined,
        metadata: {
          connect: { id: metadata.id },
        },
      },
      update: {
        ...statedTotalEmissions,
        metadata: {
          connect: { id: metadata.id },
        },
      },
      select: { id: true },
    })
  }

  async deleteStatedTotalEmissions(id: StatedTotalEmissions['id']) {
    return await prisma.statedTotalEmissions.delete({ where: { id } })
  }
}

export const emissionsService = new EmissionsService()
