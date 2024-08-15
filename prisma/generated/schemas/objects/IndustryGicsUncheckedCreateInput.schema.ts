import { z } from 'zod'
import { CompanyUncheckedCreateNestedManyWithoutIndustryGicsInputObjectSchema } from './CompanyUncheckedCreateNestedManyWithoutIndustryGicsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.IndustryGicsUncheckedCreateInput> = z
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
    companies: z
      .lazy(
        () =>
          CompanyUncheckedCreateNestedManyWithoutIndustryGicsInputObjectSchema
      )
      .optional(),
  })
  .strict()

export const IndustryGicsUncheckedCreateInputObjectSchema = Schema
