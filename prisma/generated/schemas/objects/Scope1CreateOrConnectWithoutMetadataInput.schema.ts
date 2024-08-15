import { z } from 'zod'
import { Scope1WhereUniqueInputObjectSchema } from './Scope1WhereUniqueInput.schema'
import { Scope1CreateWithoutMetadataInputObjectSchema } from './Scope1CreateWithoutMetadataInput.schema'
import { Scope1UncheckedCreateWithoutMetadataInputObjectSchema } from './Scope1UncheckedCreateWithoutMetadataInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope1CreateOrConnectWithoutMetadataInput> = z
  .object({
    where: z.lazy(() => Scope1WhereUniqueInputObjectSchema),
    create: z.union([
      z.lazy(() => Scope1CreateWithoutMetadataInputObjectSchema),
      z.lazy(() => Scope1UncheckedCreateWithoutMetadataInputObjectSchema),
    ]),
  })
  .strict()

export const Scope1CreateOrConnectWithoutMetadataInputObjectSchema = Schema
