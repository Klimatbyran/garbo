import { z } from 'zod'
import { CompanyCreateWithoutGoalsInputObjectSchema } from './CompanyCreateWithoutGoalsInput.schema'
import { CompanyUncheckedCreateWithoutGoalsInputObjectSchema } from './CompanyUncheckedCreateWithoutGoalsInput.schema'
import { CompanyCreateOrConnectWithoutGoalsInputObjectSchema } from './CompanyCreateOrConnectWithoutGoalsInput.schema'
import { CompanyUpsertWithoutGoalsInputObjectSchema } from './CompanyUpsertWithoutGoalsInput.schema'
import { CompanyWhereUniqueInputObjectSchema } from './CompanyWhereUniqueInput.schema'
import { CompanyUpdateWithoutGoalsInputObjectSchema } from './CompanyUpdateWithoutGoalsInput.schema'
import { CompanyUncheckedUpdateWithoutGoalsInputObjectSchema } from './CompanyUncheckedUpdateWithoutGoalsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyUpdateOneRequiredWithoutGoalsNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => CompanyCreateWithoutGoalsInputObjectSchema),
          z.lazy(() => CompanyUncheckedCreateWithoutGoalsInputObjectSchema),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => CompanyCreateOrConnectWithoutGoalsInputObjectSchema)
        .optional(),
      upsert: z
        .lazy(() => CompanyUpsertWithoutGoalsInputObjectSchema)
        .optional(),
      connect: z.lazy(() => CompanyWhereUniqueInputObjectSchema).optional(),
      update: z
        .union([
          z.lazy(() => CompanyUpdateWithoutGoalsInputObjectSchema),
          z.lazy(() => CompanyUncheckedUpdateWithoutGoalsInputObjectSchema),
        ])
        .optional(),
    })
    .strict()

export const CompanyUpdateOneRequiredWithoutGoalsNestedInputObjectSchema =
  Schema
