import { z } from 'zod'
import { Scope1WhereUniqueInputObjectSchema } from './Scope1WhereUniqueInput.schema'
import { Scope1UpdateWithoutMetadataInputObjectSchema } from './Scope1UpdateWithoutMetadataInput.schema'
import { Scope1UncheckedUpdateWithoutMetadataInputObjectSchema } from './Scope1UncheckedUpdateWithoutMetadataInput.schema'
import { Scope1CreateWithoutMetadataInputObjectSchema } from './Scope1CreateWithoutMetadataInput.schema'
import { Scope1UncheckedCreateWithoutMetadataInputObjectSchema } from './Scope1UncheckedCreateWithoutMetadataInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope1UpsertWithWhereUniqueWithoutMetadataInput> =
  z
    .object({
      where: z.lazy(() => Scope1WhereUniqueInputObjectSchema),
      update: z.union([
        z.lazy(() => Scope1UpdateWithoutMetadataInputObjectSchema),
        z.lazy(() => Scope1UncheckedUpdateWithoutMetadataInputObjectSchema),
      ]),
      create: z.union([
        z.lazy(() => Scope1CreateWithoutMetadataInputObjectSchema),
        z.lazy(() => Scope1UncheckedCreateWithoutMetadataInputObjectSchema),
      ]),
    })
    .strict()

export const Scope1UpsertWithWhereUniqueWithoutMetadataInputObjectSchema =
  Schema
