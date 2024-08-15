import { z } from 'zod'
import { Scope2WhereUniqueInputObjectSchema } from './Scope2WhereUniqueInput.schema'
import { Scope2CreateWithoutMetadataInputObjectSchema } from './Scope2CreateWithoutMetadataInput.schema'
import { Scope2UncheckedCreateWithoutMetadataInputObjectSchema } from './Scope2UncheckedCreateWithoutMetadataInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope2CreateOrConnectWithoutMetadataInput> = z
  .object({
    where: z.lazy(() => Scope2WhereUniqueInputObjectSchema),
    create: z.union([
      z.lazy(() => Scope2CreateWithoutMetadataInputObjectSchema),
      z.lazy(() => Scope2UncheckedCreateWithoutMetadataInputObjectSchema),
    ]),
  })
  .strict()

export const Scope2CreateOrConnectWithoutMetadataInputObjectSchema = Schema
