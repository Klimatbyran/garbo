import { z } from 'zod'
import { CompanyCreateNestedOneWithoutGoalsInputObjectSchema } from './CompanyCreateNestedOneWithoutGoalsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.GoalCreateWithoutMetadataInput> = z
  .object({
    description: z.string(),
    year: z.string().optional().nullable(),
    target: z.number().optional().nullable(),
    baseYear: z.string(),
    company: z.lazy(() => CompanyCreateNestedOneWithoutGoalsInputObjectSchema),
  })
  .strict()

export const GoalCreateWithoutMetadataInputObjectSchema = Schema
