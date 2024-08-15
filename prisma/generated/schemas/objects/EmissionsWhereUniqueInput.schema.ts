import { z } from 'zod'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EmissionsWhereUniqueInput> = z
  .object({
    id: z.number().optional(),
    fiscalYearId: z.number().optional(),
    scope1Id: z.number().optional(),
    scope2Id: z.number().optional(),
    scope3Id: z.number().optional(),
  })
  .strict()

export const EmissionsWhereUniqueInputObjectSchema = Schema
