import { z } from 'zod'
import { CompanyUpdateWithoutInitiativesInputObjectSchema } from './CompanyUpdateWithoutInitiativesInput.schema'
import { CompanyUncheckedUpdateWithoutInitiativesInputObjectSchema } from './CompanyUncheckedUpdateWithoutInitiativesInput.schema'
import { CompanyCreateWithoutInitiativesInputObjectSchema } from './CompanyCreateWithoutInitiativesInput.schema'
import { CompanyUncheckedCreateWithoutInitiativesInputObjectSchema } from './CompanyUncheckedCreateWithoutInitiativesInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyUpsertWithoutInitiativesInput> = z
  .object({
    update: z.union([
      z.lazy(() => CompanyUpdateWithoutInitiativesInputObjectSchema),
      z.lazy(() => CompanyUncheckedUpdateWithoutInitiativesInputObjectSchema),
    ]),
    create: z.union([
      z.lazy(() => CompanyCreateWithoutInitiativesInputObjectSchema),
      z.lazy(() => CompanyUncheckedCreateWithoutInitiativesInputObjectSchema),
    ]),
  })
  .strict()

export const CompanyUpsertWithoutInitiativesInputObjectSchema = Schema
