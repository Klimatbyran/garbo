import { z } from 'zod'
import { FiscalYearCreateWithoutCompanyInputObjectSchema } from './FiscalYearCreateWithoutCompanyInput.schema'
import { FiscalYearUncheckedCreateWithoutCompanyInputObjectSchema } from './FiscalYearUncheckedCreateWithoutCompanyInput.schema'
import { FiscalYearCreateOrConnectWithoutCompanyInputObjectSchema } from './FiscalYearCreateOrConnectWithoutCompanyInput.schema'
import { FiscalYearWhereUniqueInputObjectSchema } from './FiscalYearWhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.FiscalYearUncheckedCreateNestedManyWithoutCompanyInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => FiscalYearCreateWithoutCompanyInputObjectSchema),
          z.lazy(() => FiscalYearCreateWithoutCompanyInputObjectSchema).array(),
          z.lazy(
            () => FiscalYearUncheckedCreateWithoutCompanyInputObjectSchema
          ),
          z
            .lazy(
              () => FiscalYearUncheckedCreateWithoutCompanyInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () => FiscalYearCreateOrConnectWithoutCompanyInputObjectSchema
          ),
          z
            .lazy(
              () => FiscalYearCreateOrConnectWithoutCompanyInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => FiscalYearWhereUniqueInputObjectSchema),
          z.lazy(() => FiscalYearWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
    })
    .strict()

export const FiscalYearUncheckedCreateNestedManyWithoutCompanyInputObjectSchema =
  Schema
