import { z } from 'zod'
import { EmissionsCreateWithoutFiscalYearInputObjectSchema } from './EmissionsCreateWithoutFiscalYearInput.schema'
import { EmissionsUncheckedCreateWithoutFiscalYearInputObjectSchema } from './EmissionsUncheckedCreateWithoutFiscalYearInput.schema'
import { EmissionsCreateOrConnectWithoutFiscalYearInputObjectSchema } from './EmissionsCreateOrConnectWithoutFiscalYearInput.schema'
import { EmissionsUpsertWithoutFiscalYearInputObjectSchema } from './EmissionsUpsertWithoutFiscalYearInput.schema'
import { EmissionsWhereUniqueInputObjectSchema } from './EmissionsWhereUniqueInput.schema'
import { EmissionsUpdateWithoutFiscalYearInputObjectSchema } from './EmissionsUpdateWithoutFiscalYearInput.schema'
import { EmissionsUncheckedUpdateWithoutFiscalYearInputObjectSchema } from './EmissionsUncheckedUpdateWithoutFiscalYearInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EmissionsUncheckedUpdateOneWithoutFiscalYearNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => EmissionsCreateWithoutFiscalYearInputObjectSchema),
          z.lazy(
            () => EmissionsUncheckedCreateWithoutFiscalYearInputObjectSchema
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => EmissionsCreateOrConnectWithoutFiscalYearInputObjectSchema)
        .optional(),
      upsert: z
        .lazy(() => EmissionsUpsertWithoutFiscalYearInputObjectSchema)
        .optional(),
      disconnect: z.boolean().optional(),
      delete: z.boolean().optional(),
      connect: z.lazy(() => EmissionsWhereUniqueInputObjectSchema).optional(),
      update: z
        .union([
          z.lazy(() => EmissionsUpdateWithoutFiscalYearInputObjectSchema),
          z.lazy(
            () => EmissionsUncheckedUpdateWithoutFiscalYearInputObjectSchema
          ),
        ])
        .optional(),
    })
    .strict()

export const EmissionsUncheckedUpdateOneWithoutFiscalYearNestedInputObjectSchema =
  Schema
