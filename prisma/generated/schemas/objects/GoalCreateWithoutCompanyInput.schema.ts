import { z } from 'zod'
import { MetadataCreateNestedOneWithoutGoalInputObjectSchema } from './MetadataCreateNestedOneWithoutGoalInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.GoalCreateWithoutCompanyInput> = z
  .object({
    description: z.string(),
    year: z.string().optional().nullable(),
    target: z.number().optional().nullable(),
    baseYear: z.string(),
    metadata: z.lazy(() => MetadataCreateNestedOneWithoutGoalInputObjectSchema),
  })
  .strict()

export const GoalCreateWithoutCompanyInputObjectSchema = Schema
