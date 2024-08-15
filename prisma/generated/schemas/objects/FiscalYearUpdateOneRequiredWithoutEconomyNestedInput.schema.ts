import { z } from 'zod'
import { FiscalYearCreateWithoutEconomyInputObjectSchema } from './FiscalYearCreateWithoutEconomyInput.schema'
import { FiscalYearUncheckedCreateWithoutEconomyInputObjectSchema } from './FiscalYearUncheckedCreateWithoutEconomyInput.schema'
import { FiscalYearCreateOrConnectWithoutEconomyInputObjectSchema } from './FiscalYearCreateOrConnectWithoutEconomyInput.schema'
import { FiscalYearUpsertWithoutEconomyInputObjectSchema } from './FiscalYearUpsertWithoutEconomyInput.schema'
import { FiscalYearWhereUniqueInputObjectSchema } from './FiscalYearWhereUniqueInput.schema'
import { FiscalYearUpdateWithoutEconomyInputObjectSchema } from './FiscalYearUpdateWithoutEconomyInput.schema'
import { FiscalYearUncheckedUpdateWithoutEconomyInputObjectSchema } from './FiscalYearUncheckedUpdateWithoutEconomyInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.FiscalYearUpdateOneRequiredWithoutEconomyNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => FiscalYearCreateWithoutEconomyInputObjectSchema),
          z.lazy(
            () => FiscalYearUncheckedCreateWithoutEconomyInputObjectSchema
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => FiscalYearCreateOrConnectWithoutEconomyInputObjectSchema)
        .optional(),
      upsert: z
        .lazy(() => FiscalYearUpsertWithoutEconomyInputObjectSchema)
        .optional(),
      connect: z.lazy(() => FiscalYearWhereUniqueInputObjectSchema).optional(),
      update: z
        .union([
          z.lazy(() => FiscalYearUpdateWithoutEconomyInputObjectSchema),
          z.lazy(
            () => FiscalYearUncheckedUpdateWithoutEconomyInputObjectSchema
          ),
        ])
        .optional(),
    })
    .strict()

export const FiscalYearUpdateOneRequiredWithoutEconomyNestedInputObjectSchema =
  Schema
