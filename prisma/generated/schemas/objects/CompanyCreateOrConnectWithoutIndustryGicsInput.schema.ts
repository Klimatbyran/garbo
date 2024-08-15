import { z } from 'zod'
import { CompanyWhereUniqueInputObjectSchema } from './CompanyWhereUniqueInput.schema'
import { CompanyCreateWithoutIndustryGicsInputObjectSchema } from './CompanyCreateWithoutIndustryGicsInput.schema'
import { CompanyUncheckedCreateWithoutIndustryGicsInputObjectSchema } from './CompanyUncheckedCreateWithoutIndustryGicsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyCreateOrConnectWithoutIndustryGicsInput> =
  z
    .object({
      where: z.lazy(() => CompanyWhereUniqueInputObjectSchema),
      create: z.union([
        z.lazy(() => CompanyCreateWithoutIndustryGicsInputObjectSchema),
        z.lazy(
          () => CompanyUncheckedCreateWithoutIndustryGicsInputObjectSchema
        ),
      ]),
    })
    .strict()

export const CompanyCreateOrConnectWithoutIndustryGicsInputObjectSchema = Schema
