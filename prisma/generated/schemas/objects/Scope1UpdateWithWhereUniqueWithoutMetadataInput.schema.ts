import { z } from 'zod'
import { Scope1WhereUniqueInputObjectSchema } from './Scope1WhereUniqueInput.schema'
import { Scope1UpdateWithoutMetadataInputObjectSchema } from './Scope1UpdateWithoutMetadataInput.schema'
import { Scope1UncheckedUpdateWithoutMetadataInputObjectSchema } from './Scope1UncheckedUpdateWithoutMetadataInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope1UpdateWithWhereUniqueWithoutMetadataInput> =
  z
    .object({
      where: z.lazy(() => Scope1WhereUniqueInputObjectSchema),
      data: z.union([
        z.lazy(() => Scope1UpdateWithoutMetadataInputObjectSchema),
        z.lazy(() => Scope1UncheckedUpdateWithoutMetadataInputObjectSchema),
      ]),
    })
    .strict()

export const Scope1UpdateWithWhereUniqueWithoutMetadataInputObjectSchema =
  Schema
