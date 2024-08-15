import { z } from 'zod'
import { CompanyWhereUniqueInputObjectSchema } from './CompanyWhereUniqueInput.schema'
import { CompanyUpdateWithoutIndustryGicsInputObjectSchema } from './CompanyUpdateWithoutIndustryGicsInput.schema'
import { CompanyUncheckedUpdateWithoutIndustryGicsInputObjectSchema } from './CompanyUncheckedUpdateWithoutIndustryGicsInput.schema'
import { CompanyCreateWithoutIndustryGicsInputObjectSchema } from './CompanyCreateWithoutIndustryGicsInput.schema'
import { CompanyUncheckedCreateWithoutIndustryGicsInputObjectSchema } from './CompanyUncheckedCreateWithoutIndustryGicsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyUpsertWithWhereUniqueWithoutIndustryGicsInput> =
  z
    .object({
      where: z.lazy(() => CompanyWhereUniqueInputObjectSchema),
      update: z.union([
        z.lazy(() => CompanyUpdateWithoutIndustryGicsInputObjectSchema),
        z.lazy(
          () => CompanyUncheckedUpdateWithoutIndustryGicsInputObjectSchema
        ),
      ]),
      create: z.union([
        z.lazy(() => CompanyCreateWithoutIndustryGicsInputObjectSchema),
        z.lazy(
          () => CompanyUncheckedCreateWithoutIndustryGicsInputObjectSchema
        ),
      ]),
    })
    .strict()

export const CompanyUpsertWithWhereUniqueWithoutIndustryGicsInputObjectSchema =
  Schema
