import { z } from 'zod'
import { Scope2WhereUniqueInputObjectSchema } from './Scope2WhereUniqueInput.schema'
import { Scope2UpdateWithoutMetadataInputObjectSchema } from './Scope2UpdateWithoutMetadataInput.schema'
import { Scope2UncheckedUpdateWithoutMetadataInputObjectSchema } from './Scope2UncheckedUpdateWithoutMetadataInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope2UpdateWithWhereUniqueWithoutMetadataInput> =
  z
    .object({
      where: z.lazy(() => Scope2WhereUniqueInputObjectSchema),
      data: z.union([
        z.lazy(() => Scope2UpdateWithoutMetadataInputObjectSchema),
        z.lazy(() => Scope2UncheckedUpdateWithoutMetadataInputObjectSchema),
      ]),
    })
    .strict()

export const Scope2UpdateWithWhereUniqueWithoutMetadataInputObjectSchema =
  Schema
