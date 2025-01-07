import {
  BiogenicEmissions,
  Metadata,
  Prisma,
  Scope1,
  Scope1And2,
  Scope3,
  Scope3Category,
  StatedTotalEmissions,
} from '@prisma/client'
import { OptionalNullable } from '../../lib/type-utils'
import { DefaultEmissions, emissionsArgs } from '../types'
import { prisma } from '../..'
import { GarboAPIError } from '../../lib/garbo-api-error'

const TONNES_CO2_UNIT = 'tCO2e'

class EmissionsService {
  async upsertEmissions({
    emissionsId,
    reportingPeriodId,
  }: {
    emissionsId: number
    reportingPeriodId: number
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
    scope1: Omit<Scope1, 'id' | 'metadataId' | 'unit' | 'emissionsId'>,
    metadata: Metadata
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
            unit: TONNES_CO2_UNIT,
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
    try {
      return await prisma.scope1.delete({ where: { id } })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new GarboAPIError('Scope1 not found', {
          statusCode: 404,
        })
      }
      throw error
    }
  }

  async upsertScope2(
    emissions: DefaultEmissions,
    scope2: {
      lb?: number
      mb?: number
      unknown?: number
    },
    metadata: Metadata
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
            unit: TONNES_CO2_UNIT,
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

  async deleteScope2(id: number) {
    try {
      return await prisma.scope2.delete({ where: { id } })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new GarboAPIError('Scope2 not found', {
          statusCode: 404,
        })
      }
      throw error
    }
  }

  async upsertScope1And2(
    emissions: DefaultEmissions,
    scope1And2: Omit<Scope1And2, 'id' | 'metadataId' | 'unit' | 'emissionsId'>,
    metadata: Metadata
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
            unit: TONNES_CO2_UNIT,
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
    try {
      return await prisma.scope1And2.delete({ where: { id } })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new GarboAPIError('Scope1And2 not found', {
          statusCode: 404,
        })
      }
      throw error
    }
  }

  async upsertScope3(
    emissions: DefaultEmissions,
    scope3: {
      categories?: { category: number; total: number }[]
      statedTotalEmissions?: Omit<
        StatedTotalEmissions,
        'id' | 'metadataId' | 'unit' | 'scope3Id' | 'emissionsId'
      >
    },
    metadata: Metadata
  ) {
    const existingScope3Id = emissions.scope3?.id

    const updatedScope3 = await prisma.scope3.upsert({
      where: { id: existingScope3Id ?? 0 },
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
          },
        },
      },
    })

    // Upsert only the scope 3 categories from the request body
    await Promise.all(
      (scope3.categories ?? []).map((scope3Category) => {
        const matching = updatedScope3.categories.find(
          ({ category }) => scope3Category.category === category
        )

        if (scope3Category.total === null) {
          return null
        }

        return prisma.scope3Category.upsert({
          where: {
            id: matching?.id ?? 0,
          },
          update: {
            ...scope3Category,
            metadata: {
              connect: {
                id: metadata.id,
              },
            },
          },
          create: {
            ...scope3Category,
            unit: TONNES_CO2_UNIT,
            scope3: {
              connect: {
                id: updatedScope3.id,
              },
            },
            metadata: {
              connect: {
                id: metadata.id,
              },
            },
          },
          select: { id: true },
        })
      })
    )

    if (scope3.statedTotalEmissions) {
      await this.upsertStatedTotalEmissions(
        emissions,
        metadata,
        scope3.statedTotalEmissions,
        updatedScope3
      )
    }
  }

  async deleteScope3(id: Scope3['id']) {
    try {
      return await prisma.scope3.delete({ where: { id } })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new GarboAPIError('Scope3 not found', {
          statusCode: 404,
        })
      }
      throw error
    }
  }

  async deleteScope3Category(id: Scope3Category['id']) {
    try {
      return await prisma.scope3Category.delete({ where: { id } })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new GarboAPIError('Scope3Category not found', {
          statusCode: 404,
        })
      }
      throw error
    }
  }

  async upsertBiogenic(
    emissions: DefaultEmissions,
    biogenic: OptionalNullable<
      Omit<BiogenicEmissions, 'id' | 'metadataId' | 'unit' | 'emissionsId'>
    >,
    metadata: Metadata
  ) {
    const existingBiogenicEmissionsId = emissions.biogenicEmissions?.id

    return existingBiogenicEmissionsId
      ? prisma.biogenicEmissions.update({
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
      : prisma.biogenicEmissions.create({
          data: {
            ...biogenic,
            unit: TONNES_CO2_UNIT,
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
    try {
      return await prisma.biogenicEmissions.delete({ where: { id } })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new GarboAPIError('BiogenicEmissions not found', {
          statusCode: 404,
        })
      }
      throw error
    }
  }

  async upsertStatedTotalEmissions(
    emissions: DefaultEmissions,
    metadata: Metadata,
    statedTotalEmissions?: Omit<
      StatedTotalEmissions,
      'id' | 'metadataId' | 'unit' | 'scope3Id' | 'emissionsId'
    >,
    scope3?: Scope3 & { statedTotalEmissions: { id: number } | null }
  ) {
    const statedTotalEmissionsId = scope3
      ? scope3.statedTotalEmissionsId || scope3?.statedTotalEmissions?.id
      : emissions.statedTotalEmissions?.id

    return prisma.statedTotalEmissions.upsert({
      where: { id: statedTotalEmissionsId ?? 0 },
      create: {
        ...statedTotalEmissions,
        unit: TONNES_CO2_UNIT,
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
    try {
      return await prisma.statedTotalEmissions.delete({ where: { id } })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new GarboAPIError('StatedTotalEmissions not found', {
          statusCode: 404,
        })
      }
      throw error
    }
  }
}

export const emissionsService = new EmissionsService()
