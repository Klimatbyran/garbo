import { z } from 'zod'
import { CompanyCreateWithoutFiscalYearsInputObjectSchema } from './CompanyCreateWithoutFiscalYearsInput.schema'
import { CompanyUncheckedCreateWithoutFiscalYearsInputObjectSchema } from './CompanyUncheckedCreateWithoutFiscalYearsInput.schema'
import { CompanyCreateOrConnectWithoutFiscalYearsInputObjectSchema } from './CompanyCreateOrConnectWithoutFiscalYearsInput.schema'
import { CompanyWhereUniqueInputObjectSchema } from './CompanyWhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyCreateNestedOneWithoutFiscalYearsInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => CompanyCreateWithoutFiscalYearsInputObjectSchema),
          z.lazy(
            () => CompanyUncheckedCreateWithoutFiscalYearsInputObjectSchema
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => CompanyCreateOrConnectWithoutFiscalYearsInputObjectSchema)
        .optional(),
      connect: z.lazy(() => CompanyWhereUniqueInputObjectSchema).optional(),
    })
    .strict()

export const CompanyCreateNestedOneWithoutFiscalYearsInputObjectSchema = Schema
