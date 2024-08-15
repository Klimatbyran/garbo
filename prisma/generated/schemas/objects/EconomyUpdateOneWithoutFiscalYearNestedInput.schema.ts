import { z } from 'zod'
import { EconomyCreateWithoutFiscalYearInputObjectSchema } from './EconomyCreateWithoutFiscalYearInput.schema'
import { EconomyUncheckedCreateWithoutFiscalYearInputObjectSchema } from './EconomyUncheckedCreateWithoutFiscalYearInput.schema'
import { EconomyCreateOrConnectWithoutFiscalYearInputObjectSchema } from './EconomyCreateOrConnectWithoutFiscalYearInput.schema'
import { EconomyUpsertWithoutFiscalYearInputObjectSchema } from './EconomyUpsertWithoutFiscalYearInput.schema'
import { EconomyWhereUniqueInputObjectSchema } from './EconomyWhereUniqueInput.schema'
import { EconomyUpdateWithoutFiscalYearInputObjectSchema } from './EconomyUpdateWithoutFiscalYearInput.schema'
import { EconomyUncheckedUpdateWithoutFiscalYearInputObjectSchema } from './EconomyUncheckedUpdateWithoutFiscalYearInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EconomyUpdateOneWithoutFiscalYearNestedInput> = z
  .object({
    create: z
      .union([
        z.lazy(() => EconomyCreateWithoutFiscalYearInputObjectSchema),
        z.lazy(() => EconomyUncheckedCreateWithoutFiscalYearInputObjectSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => EconomyCreateOrConnectWithoutFiscalYearInputObjectSchema)
      .optional(),
    upsert: z
      .lazy(() => EconomyUpsertWithoutFiscalYearInputObjectSchema)
      .optional(),
    disconnect: z.boolean().optional(),
    delete: z.boolean().optional(),
    connect: z.lazy(() => EconomyWhereUniqueInputObjectSchema).optional(),
    update: z
      .union([
        z.lazy(() => EconomyUpdateWithoutFiscalYearInputObjectSchema),
        z.lazy(() => EconomyUncheckedUpdateWithoutFiscalYearInputObjectSchema),
      ])
      .optional(),
  })
  .strict()

export const EconomyUpdateOneWithoutFiscalYearNestedInputObjectSchema = Schema
