import { z } from 'zod'
import { FiscalYearWhereUniqueInputObjectSchema } from './FiscalYearWhereUniqueInput.schema'
import { FiscalYearCreateWithoutEconomyInputObjectSchema } from './FiscalYearCreateWithoutEconomyInput.schema'
import { FiscalYearUncheckedCreateWithoutEconomyInputObjectSchema } from './FiscalYearUncheckedCreateWithoutEconomyInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.FiscalYearCreateOrConnectWithoutEconomyInput> = z
  .object({
    where: z.lazy(() => FiscalYearWhereUniqueInputObjectSchema),
    create: z.union([
      z.lazy(() => FiscalYearCreateWithoutEconomyInputObjectSchema),
      z.lazy(() => FiscalYearUncheckedCreateWithoutEconomyInputObjectSchema),
    ]),
  })
  .strict()

export const FiscalYearCreateOrConnectWithoutEconomyInputObjectSchema = Schema
