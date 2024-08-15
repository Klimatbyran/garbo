import { z } from 'zod'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.IndustryGicsMinAggregateInputType> = z
  .object({
    id: z.literal(true).optional(),
    name: z.literal(true).optional(),
    sectorCode: z.literal(true).optional(),
    sectorName: z.literal(true).optional(),
    groupCode: z.literal(true).optional(),
    groupName: z.literal(true).optional(),
    industryCode: z.literal(true).optional(),
    industryName: z.literal(true).optional(),
    subIndustryCode: z.literal(true).optional(),
    subIndustryName: z.literal(true).optional(),
  })
  .strict()

export const IndustryGicsMinAggregateInputObjectSchema = Schema
