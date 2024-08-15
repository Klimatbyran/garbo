import { z } from 'zod'
import { EmissionsWhereUniqueInputObjectSchema } from './EmissionsWhereUniqueInput.schema'
import { EmissionsCreateWithoutFiscalYearInputObjectSchema } from './EmissionsCreateWithoutFiscalYearInput.schema'
import { EmissionsUncheckedCreateWithoutFiscalYearInputObjectSchema } from './EmissionsUncheckedCreateWithoutFiscalYearInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EmissionsCreateOrConnectWithoutFiscalYearInput> =
  z
    .object({
      where: z.lazy(() => EmissionsWhereUniqueInputObjectSchema),
      create: z.union([
        z.lazy(() => EmissionsCreateWithoutFiscalYearInputObjectSchema),
        z.lazy(
          () => EmissionsUncheckedCreateWithoutFiscalYearInputObjectSchema
        ),
      ]),
    })
    .strict()

export const EmissionsCreateOrConnectWithoutFiscalYearInputObjectSchema = Schema
