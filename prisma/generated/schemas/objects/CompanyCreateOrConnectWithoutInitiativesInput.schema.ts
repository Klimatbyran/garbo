import { z } from 'zod'
import { CompanyWhereUniqueInputObjectSchema } from './CompanyWhereUniqueInput.schema'
import { CompanyCreateWithoutInitiativesInputObjectSchema } from './CompanyCreateWithoutInitiativesInput.schema'
import { CompanyUncheckedCreateWithoutInitiativesInputObjectSchema } from './CompanyUncheckedCreateWithoutInitiativesInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyCreateOrConnectWithoutInitiativesInput> =
  z
    .object({
      where: z.lazy(() => CompanyWhereUniqueInputObjectSchema),
      create: z.union([
        z.lazy(() => CompanyCreateWithoutInitiativesInputObjectSchema),
        z.lazy(() => CompanyUncheckedCreateWithoutInitiativesInputObjectSchema),
      ]),
    })
    .strict()

export const CompanyCreateOrConnectWithoutInitiativesInputObjectSchema = Schema
