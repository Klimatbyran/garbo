import { z } from 'zod'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.IndustryGicsUncheckedCreateWithoutCompaniesInput> =
  z
    .object({
      id: z.number().optional(),
      name: z.string(),
      sectorCode: z.string(),
      sectorName: z.string(),
      groupCode: z.string(),
      groupName: z.string(),
      industryCode: z.string(),
      industryName: z.string(),
      subIndustryCode: z.string(),
      subIndustryName: z.string(),
    })
    .strict()

export const IndustryGicsUncheckedCreateWithoutCompaniesInputObjectSchema =
  Schema
