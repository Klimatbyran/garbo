import { z } from 'zod'
import { EmissionsCreateWithoutFiscalYearInputObjectSchema } from './EmissionsCreateWithoutFiscalYearInput.schema'
import { EmissionsUncheckedCreateWithoutFiscalYearInputObjectSchema } from './EmissionsUncheckedCreateWithoutFiscalYearInput.schema'
import { EmissionsCreateOrConnectWithoutFiscalYearInputObjectSchema } from './EmissionsCreateOrConnectWithoutFiscalYearInput.schema'
import { EmissionsWhereUniqueInputObjectSchema } from './EmissionsWhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EmissionsUncheckedCreateNestedOneWithoutFiscalYearInput> =
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
      connect: z.lazy(() => EmissionsWhereUniqueInputObjectSchema).optional(),
    })
    .strict()

export const EmissionsUncheckedCreateNestedOneWithoutFiscalYearInputObjectSchema =
  Schema
