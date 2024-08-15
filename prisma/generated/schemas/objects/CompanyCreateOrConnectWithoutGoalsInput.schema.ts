import { z } from 'zod'
import { CompanyWhereUniqueInputObjectSchema } from './CompanyWhereUniqueInput.schema'
import { CompanyCreateWithoutGoalsInputObjectSchema } from './CompanyCreateWithoutGoalsInput.schema'
import { CompanyUncheckedCreateWithoutGoalsInputObjectSchema } from './CompanyUncheckedCreateWithoutGoalsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyCreateOrConnectWithoutGoalsInput> = z
  .object({
    where: z.lazy(() => CompanyWhereUniqueInputObjectSchema),
    create: z.union([
      z.lazy(() => CompanyCreateWithoutGoalsInputObjectSchema),
      z.lazy(() => CompanyUncheckedCreateWithoutGoalsInputObjectSchema),
    ]),
  })
  .strict()

export const CompanyCreateOrConnectWithoutGoalsInputObjectSchema = Schema
