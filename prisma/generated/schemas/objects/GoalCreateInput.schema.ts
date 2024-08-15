import { z } from 'zod'
import { MetadataCreateNestedOneWithoutGoalInputObjectSchema } from './MetadataCreateNestedOneWithoutGoalInput.schema'
import { CompanyCreateNestedOneWithoutGoalsInputObjectSchema } from './CompanyCreateNestedOneWithoutGoalsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.GoalCreateInput> = z
  .object({
    description: z.string(),
    year: z.string().optional().nullable(),
    target: z.number().optional().nullable(),
    baseYear: z.string(),
    metadata: z.lazy(() => MetadataCreateNestedOneWithoutGoalInputObjectSchema),
    company: z.lazy(() => CompanyCreateNestedOneWithoutGoalsInputObjectSchema),
  })
  .strict()

export const GoalCreateInputObjectSchema = Schema
