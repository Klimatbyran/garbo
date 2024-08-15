import { z } from 'zod'
import { FiscalYearWhereUniqueInputObjectSchema } from './FiscalYearWhereUniqueInput.schema'
import { FiscalYearCreateWithoutEmissionsInputObjectSchema } from './FiscalYearCreateWithoutEmissionsInput.schema'
import { FiscalYearUncheckedCreateWithoutEmissionsInputObjectSchema } from './FiscalYearUncheckedCreateWithoutEmissionsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.FiscalYearCreateOrConnectWithoutEmissionsInput> =
  z
    .object({
      where: z.lazy(() => FiscalYearWhereUniqueInputObjectSchema),
      create: z.union([
        z.lazy(() => FiscalYearCreateWithoutEmissionsInputObjectSchema),
        z.lazy(
          () => FiscalYearUncheckedCreateWithoutEmissionsInputObjectSchema
        ),
      ]),
    })
    .strict()

export const FiscalYearCreateOrConnectWithoutEmissionsInputObjectSchema = Schema
