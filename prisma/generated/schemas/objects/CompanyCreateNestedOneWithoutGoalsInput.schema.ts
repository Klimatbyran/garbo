import { z } from 'zod'
import { CompanyCreateWithoutGoalsInputObjectSchema } from './CompanyCreateWithoutGoalsInput.schema'
import { CompanyUncheckedCreateWithoutGoalsInputObjectSchema } from './CompanyUncheckedCreateWithoutGoalsInput.schema'
import { CompanyCreateOrConnectWithoutGoalsInputObjectSchema } from './CompanyCreateOrConnectWithoutGoalsInput.schema'
import { CompanyWhereUniqueInputObjectSchema } from './CompanyWhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyCreateNestedOneWithoutGoalsInput> = z
  .object({
    create: z
      .union([
        z.lazy(() => CompanyCreateWithoutGoalsInputObjectSchema),
        z.lazy(() => CompanyUncheckedCreateWithoutGoalsInputObjectSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => CompanyCreateOrConnectWithoutGoalsInputObjectSchema)
      .optional(),
    connect: z.lazy(() => CompanyWhereUniqueInputObjectSchema).optional(),
  })
  .strict()

export const CompanyCreateNestedOneWithoutGoalsInputObjectSchema = Schema
