import { z } from 'zod'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.InitiativeUncheckedCreateInput> = z
  .object({
    id: z.number().optional(),
    title: z.string(),
    description: z.string(),
    year: z.string().optional().nullable(),
    scope: z.string(),
    companyId: z.number(),
    metadataId: z.number(),
  })
  .strict()

export const InitiativeUncheckedCreateInputObjectSchema = Schema
