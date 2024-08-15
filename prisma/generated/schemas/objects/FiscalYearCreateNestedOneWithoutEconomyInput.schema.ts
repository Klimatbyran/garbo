import { z } from 'zod'
import { FiscalYearCreateWithoutEconomyInputObjectSchema } from './FiscalYearCreateWithoutEconomyInput.schema'
import { FiscalYearUncheckedCreateWithoutEconomyInputObjectSchema } from './FiscalYearUncheckedCreateWithoutEconomyInput.schema'
import { FiscalYearCreateOrConnectWithoutEconomyInputObjectSchema } from './FiscalYearCreateOrConnectWithoutEconomyInput.schema'
import { FiscalYearWhereUniqueInputObjectSchema } from './FiscalYearWhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.FiscalYearCreateNestedOneWithoutEconomyInput> = z
  .object({
    create: z
      .union([
        z.lazy(() => FiscalYearCreateWithoutEconomyInputObjectSchema),
        z.lazy(() => FiscalYearUncheckedCreateWithoutEconomyInputObjectSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => FiscalYearCreateOrConnectWithoutEconomyInputObjectSchema)
      .optional(),
    connect: z.lazy(() => FiscalYearWhereUniqueInputObjectSchema).optional(),
  })
  .strict()

export const FiscalYearCreateNestedOneWithoutEconomyInputObjectSchema = Schema
