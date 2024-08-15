import { z } from 'zod'
import { CompanyUpdateWithoutGoalsInputObjectSchema } from './CompanyUpdateWithoutGoalsInput.schema'
import { CompanyUncheckedUpdateWithoutGoalsInputObjectSchema } from './CompanyUncheckedUpdateWithoutGoalsInput.schema'
import { CompanyCreateWithoutGoalsInputObjectSchema } from './CompanyCreateWithoutGoalsInput.schema'
import { CompanyUncheckedCreateWithoutGoalsInputObjectSchema } from './CompanyUncheckedCreateWithoutGoalsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyUpsertWithoutGoalsInput> = z
  .object({
    update: z.union([
      z.lazy(() => CompanyUpdateWithoutGoalsInputObjectSchema),
      z.lazy(() => CompanyUncheckedUpdateWithoutGoalsInputObjectSchema),
    ]),
    create: z.union([
      z.lazy(() => CompanyCreateWithoutGoalsInputObjectSchema),
      z.lazy(() => CompanyUncheckedCreateWithoutGoalsInputObjectSchema),
    ]),
  })
  .strict()

export const CompanyUpsertWithoutGoalsInputObjectSchema = Schema
