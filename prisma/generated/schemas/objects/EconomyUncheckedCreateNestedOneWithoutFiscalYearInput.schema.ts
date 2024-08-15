import { z } from 'zod'
import { EconomyCreateWithoutFiscalYearInputObjectSchema } from './EconomyCreateWithoutFiscalYearInput.schema'
import { EconomyUncheckedCreateWithoutFiscalYearInputObjectSchema } from './EconomyUncheckedCreateWithoutFiscalYearInput.schema'
import { EconomyCreateOrConnectWithoutFiscalYearInputObjectSchema } from './EconomyCreateOrConnectWithoutFiscalYearInput.schema'
import { EconomyWhereUniqueInputObjectSchema } from './EconomyWhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EconomyUncheckedCreateNestedOneWithoutFiscalYearInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => EconomyCreateWithoutFiscalYearInputObjectSchema),
          z.lazy(
            () => EconomyUncheckedCreateWithoutFiscalYearInputObjectSchema
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => EconomyCreateOrConnectWithoutFiscalYearInputObjectSchema)
        .optional(),
      connect: z.lazy(() => EconomyWhereUniqueInputObjectSchema).optional(),
    })
    .strict()

export const EconomyUncheckedCreateNestedOneWithoutFiscalYearInputObjectSchema =
  Schema
