import { z } from 'zod'
import { CompanyCreateWithoutInitiativesInputObjectSchema } from './CompanyCreateWithoutInitiativesInput.schema'
import { CompanyUncheckedCreateWithoutInitiativesInputObjectSchema } from './CompanyUncheckedCreateWithoutInitiativesInput.schema'
import { CompanyCreateOrConnectWithoutInitiativesInputObjectSchema } from './CompanyCreateOrConnectWithoutInitiativesInput.schema'
import { CompanyUpsertWithoutInitiativesInputObjectSchema } from './CompanyUpsertWithoutInitiativesInput.schema'
import { CompanyWhereUniqueInputObjectSchema } from './CompanyWhereUniqueInput.schema'
import { CompanyUpdateWithoutInitiativesInputObjectSchema } from './CompanyUpdateWithoutInitiativesInput.schema'
import { CompanyUncheckedUpdateWithoutInitiativesInputObjectSchema } from './CompanyUncheckedUpdateWithoutInitiativesInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyUpdateOneRequiredWithoutInitiativesNestedInput> =
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
      upsert: z
        .lazy(() => CompanyUpsertWithoutInitiativesInputObjectSchema)
        .optional(),
      connect: z.lazy(() => CompanyWhereUniqueInputObjectSchema).optional(),
      update: z
        .union([
          z.lazy(() => CompanyUpdateWithoutInitiativesInputObjectSchema),
          z.lazy(
            () => CompanyUncheckedUpdateWithoutInitiativesInputObjectSchema
          ),
        ])
        .optional(),
    })
    .strict()

export const CompanyUpdateOneRequiredWithoutInitiativesNestedInputObjectSchema =
  Schema
