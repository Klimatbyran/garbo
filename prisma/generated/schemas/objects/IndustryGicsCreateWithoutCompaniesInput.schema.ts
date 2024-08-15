import { z } from 'zod'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.IndustryGicsCreateWithoutCompaniesInput> = z
  .object({
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

export const IndustryGicsCreateWithoutCompaniesInputObjectSchema = Schema
