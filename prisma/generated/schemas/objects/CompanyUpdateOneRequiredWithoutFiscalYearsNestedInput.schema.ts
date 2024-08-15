import { z } from 'zod'
import { CompanyCreateWithoutFiscalYearsInputObjectSchema } from './CompanyCreateWithoutFiscalYearsInput.schema'
import { CompanyUncheckedCreateWithoutFiscalYearsInputObjectSchema } from './CompanyUncheckedCreateWithoutFiscalYearsInput.schema'
import { CompanyCreateOrConnectWithoutFiscalYearsInputObjectSchema } from './CompanyCreateOrConnectWithoutFiscalYearsInput.schema'
import { CompanyUpsertWithoutFiscalYearsInputObjectSchema } from './CompanyUpsertWithoutFiscalYearsInput.schema'
import { CompanyWhereUniqueInputObjectSchema } from './CompanyWhereUniqueInput.schema'
import { CompanyUpdateWithoutFiscalYearsInputObjectSchema } from './CompanyUpdateWithoutFiscalYearsInput.schema'
import { CompanyUncheckedUpdateWithoutFiscalYearsInputObjectSchema } from './CompanyUncheckedUpdateWithoutFiscalYearsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyUpdateOneRequiredWithoutFiscalYearsNestedInput> =
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
      upsert: z
        .lazy(() => CompanyUpsertWithoutFiscalYearsInputObjectSchema)
        .optional(),
      connect: z.lazy(() => CompanyWhereUniqueInputObjectSchema).optional(),
      update: z
        .union([
          z.lazy(() => CompanyUpdateWithoutFiscalYearsInputObjectSchema),
          z.lazy(
            () => CompanyUncheckedUpdateWithoutFiscalYearsInputObjectSchema
          ),
        ])
        .optional(),
    })
    .strict()

export const CompanyUpdateOneRequiredWithoutFiscalYearsNestedInputObjectSchema =
  Schema
