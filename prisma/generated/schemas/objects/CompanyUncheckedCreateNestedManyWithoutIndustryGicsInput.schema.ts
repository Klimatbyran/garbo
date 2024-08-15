import { z } from 'zod'
import { CompanyCreateWithoutIndustryGicsInputObjectSchema } from './CompanyCreateWithoutIndustryGicsInput.schema'
import { CompanyUncheckedCreateWithoutIndustryGicsInputObjectSchema } from './CompanyUncheckedCreateWithoutIndustryGicsInput.schema'
import { CompanyCreateOrConnectWithoutIndustryGicsInputObjectSchema } from './CompanyCreateOrConnectWithoutIndustryGicsInput.schema'
import { CompanyWhereUniqueInputObjectSchema } from './CompanyWhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyUncheckedCreateNestedManyWithoutIndustryGicsInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => CompanyCreateWithoutIndustryGicsInputObjectSchema),
          z
            .lazy(() => CompanyCreateWithoutIndustryGicsInputObjectSchema)
            .array(),
          z.lazy(
            () => CompanyUncheckedCreateWithoutIndustryGicsInputObjectSchema
          ),
          z
            .lazy(
              () => CompanyUncheckedCreateWithoutIndustryGicsInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () => CompanyCreateOrConnectWithoutIndustryGicsInputObjectSchema
          ),
          z
            .lazy(
              () => CompanyCreateOrConnectWithoutIndustryGicsInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => CompanyWhereUniqueInputObjectSchema),
          z.lazy(() => CompanyWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
    })
    .strict()

export const CompanyUncheckedCreateNestedManyWithoutIndustryGicsInputObjectSchema =
  Schema
