import { z } from 'zod'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.InitiativeUncheckedCreateWithoutCompanyInput> = z
  .object({
    id: z.number().optional(),
    title: z.string(),
    description: z.string(),
    year: z.string().optional().nullable(),
    scope: z.string(),
    metadataId: z.number(),
  })
  .strict()

export const InitiativeUncheckedCreateWithoutCompanyInputObjectSchema = Schema
