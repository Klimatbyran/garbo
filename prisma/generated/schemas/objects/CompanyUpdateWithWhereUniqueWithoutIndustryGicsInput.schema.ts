import { z } from 'zod'
import { CompanyWhereUniqueInputObjectSchema } from './CompanyWhereUniqueInput.schema'
import { CompanyUpdateWithoutIndustryGicsInputObjectSchema } from './CompanyUpdateWithoutIndustryGicsInput.schema'
import { CompanyUncheckedUpdateWithoutIndustryGicsInputObjectSchema } from './CompanyUncheckedUpdateWithoutIndustryGicsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyUpdateWithWhereUniqueWithoutIndustryGicsInput> =
  z
    .object({
      where: z.lazy(() => CompanyWhereUniqueInputObjectSchema),
      data: z.union([
        z.lazy(() => CompanyUpdateWithoutIndustryGicsInputObjectSchema),
        z.lazy(
          () => CompanyUncheckedUpdateWithoutIndustryGicsInputObjectSchema
        ),
      ]),
    })
    .strict()

export const CompanyUpdateWithWhereUniqueWithoutIndustryGicsInputObjectSchema =
  Schema
