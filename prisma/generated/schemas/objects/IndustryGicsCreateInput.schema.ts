import { z } from 'zod'
import { CompanyCreateNestedManyWithoutIndustryGicsInputObjectSchema } from './CompanyCreateNestedManyWithoutIndustryGicsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.IndustryGicsCreateInput> = z
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
    companies: z
      .lazy(() => CompanyCreateNestedManyWithoutIndustryGicsInputObjectSchema)
      .optional(),
  })
  .strict()

export const IndustryGicsCreateInputObjectSchema = Schema
