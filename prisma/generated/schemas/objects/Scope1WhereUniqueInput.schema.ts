import { z } from 'zod'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope1WhereUniqueInput> = z
  .object({
    id: z.number().optional(),
    emissionsId: z.number().optional(),
  })
  .strict()

export const Scope1WhereUniqueInputObjectSchema = Schema
