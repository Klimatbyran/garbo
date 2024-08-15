import { z } from 'zod'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CategoryWhereUniqueInput> = z
  .object({
    id: z.number().optional(),
  })
  .strict()

export const Scope3CategoryWhereUniqueInputObjectSchema = Schema
