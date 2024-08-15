import { z } from 'zod'
import { FiscalYearCreateWithoutEmissionsInputObjectSchema } from './FiscalYearCreateWithoutEmissionsInput.schema'
import { FiscalYearUncheckedCreateWithoutEmissionsInputObjectSchema } from './FiscalYearUncheckedCreateWithoutEmissionsInput.schema'
import { FiscalYearCreateOrConnectWithoutEmissionsInputObjectSchema } from './FiscalYearCreateOrConnectWithoutEmissionsInput.schema'
import { FiscalYearUpsertWithoutEmissionsInputObjectSchema } from './FiscalYearUpsertWithoutEmissionsInput.schema'
import { FiscalYearWhereUniqueInputObjectSchema } from './FiscalYearWhereUniqueInput.schema'
import { FiscalYearUpdateWithoutEmissionsInputObjectSchema } from './FiscalYearUpdateWithoutEmissionsInput.schema'
import { FiscalYearUncheckedUpdateWithoutEmissionsInputObjectSchema } from './FiscalYearUncheckedUpdateWithoutEmissionsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.FiscalYearUpdateOneRequiredWithoutEmissionsNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => FiscalYearCreateWithoutEmissionsInputObjectSchema),
          z.lazy(
            () => FiscalYearUncheckedCreateWithoutEmissionsInputObjectSchema
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => FiscalYearCreateOrConnectWithoutEmissionsInputObjectSchema)
        .optional(),
      upsert: z
        .lazy(() => FiscalYearUpsertWithoutEmissionsInputObjectSchema)
        .optional(),
      connect: z.lazy(() => FiscalYearWhereUniqueInputObjectSchema).optional(),
      update: z
        .union([
          z.lazy(() => FiscalYearUpdateWithoutEmissionsInputObjectSchema),
          z.lazy(
            () => FiscalYearUncheckedUpdateWithoutEmissionsInputObjectSchema
          ),
        ])
        .optional(),
    })
    .strict()

export const FiscalYearUpdateOneRequiredWithoutEmissionsNestedInputObjectSchema =
  Schema
