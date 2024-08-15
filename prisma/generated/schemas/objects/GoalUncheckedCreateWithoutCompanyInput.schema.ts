import { z } from 'zod'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.GoalUncheckedCreateWithoutCompanyInput> = z
  .object({
    id: z.number().optional(),
    description: z.string(),
    year: z.string().optional().nullable(),
    target: z.number().optional().nullable(),
    baseYear: z.string(),
    metadataId: z.number(),
  })
  .strict()

export const GoalUncheckedCreateWithoutCompanyInputObjectSchema = Schema
