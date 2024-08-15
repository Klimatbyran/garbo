import { z } from 'zod'
import { FiscalYearCreateWithoutEmissionsInputObjectSchema } from './FiscalYearCreateWithoutEmissionsInput.schema'
import { FiscalYearUncheckedCreateWithoutEmissionsInputObjectSchema } from './FiscalYearUncheckedCreateWithoutEmissionsInput.schema'
import { FiscalYearCreateOrConnectWithoutEmissionsInputObjectSchema } from './FiscalYearCreateOrConnectWithoutEmissionsInput.schema'
import { FiscalYearWhereUniqueInputObjectSchema } from './FiscalYearWhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.FiscalYearCreateNestedOneWithoutEmissionsInput> =
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
      connect: z.lazy(() => FiscalYearWhereUniqueInputObjectSchema).optional(),
    })
    .strict()

export const FiscalYearCreateNestedOneWithoutEmissionsInputObjectSchema = Schema
