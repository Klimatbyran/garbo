import { z } from 'zod'
import { CompanyCreateWithoutInitiativesInputObjectSchema } from './CompanyCreateWithoutInitiativesInput.schema'
import { CompanyUncheckedCreateWithoutInitiativesInputObjectSchema } from './CompanyUncheckedCreateWithoutInitiativesInput.schema'
import { CompanyCreateOrConnectWithoutInitiativesInputObjectSchema } from './CompanyCreateOrConnectWithoutInitiativesInput.schema'
import { CompanyWhereUniqueInputObjectSchema } from './CompanyWhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyCreateNestedOneWithoutInitiativesInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => CompanyCreateWithoutInitiativesInputObjectSchema),
          z.lazy(
            () => CompanyUncheckedCreateWithoutInitiativesInputObjectSchema
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => CompanyCreateOrConnectWithoutInitiativesInputObjectSchema)
        .optional(),
      connect: z.lazy(() => CompanyWhereUniqueInputObjectSchema).optional(),
    })
    .strict()

export const CompanyCreateNestedOneWithoutInitiativesInputObjectSchema = Schema
