import { z } from 'zod'
import { EconomyWhereUniqueInputObjectSchema } from './EconomyWhereUniqueInput.schema'
import { EconomyCreateWithoutFiscalYearInputObjectSchema } from './EconomyCreateWithoutFiscalYearInput.schema'
import { EconomyUncheckedCreateWithoutFiscalYearInputObjectSchema } from './EconomyUncheckedCreateWithoutFiscalYearInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EconomyCreateOrConnectWithoutFiscalYearInput> = z
  .object({
    where: z.lazy(() => EconomyWhereUniqueInputObjectSchema),
    create: z.union([
      z.lazy(() => EconomyCreateWithoutFiscalYearInputObjectSchema),
      z.lazy(() => EconomyUncheckedCreateWithoutFiscalYearInputObjectSchema),
    ]),
  })
  .strict()

export const EconomyCreateOrConnectWithoutFiscalYearInputObjectSchema = Schema
