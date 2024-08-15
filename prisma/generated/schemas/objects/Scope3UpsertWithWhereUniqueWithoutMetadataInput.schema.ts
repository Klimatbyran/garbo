import { z } from 'zod'
import { Scope3WhereUniqueInputObjectSchema } from './Scope3WhereUniqueInput.schema'
import { Scope3UpdateWithoutMetadataInputObjectSchema } from './Scope3UpdateWithoutMetadataInput.schema'
import { Scope3UncheckedUpdateWithoutMetadataInputObjectSchema } from './Scope3UncheckedUpdateWithoutMetadataInput.schema'
import { Scope3CreateWithoutMetadataInputObjectSchema } from './Scope3CreateWithoutMetadataInput.schema'
import { Scope3UncheckedCreateWithoutMetadataInputObjectSchema } from './Scope3UncheckedCreateWithoutMetadataInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3UpsertWithWhereUniqueWithoutMetadataInput> =
  z
    .object({
      where: z.lazy(() => Scope3WhereUniqueInputObjectSchema),
      update: z.union([
        z.lazy(() => Scope3UpdateWithoutMetadataInputObjectSchema),
        z.lazy(() => Scope3UncheckedUpdateWithoutMetadataInputObjectSchema),
      ]),
      create: z.union([
        z.lazy(() => Scope3CreateWithoutMetadataInputObjectSchema),
        z.lazy(() => Scope3UncheckedCreateWithoutMetadataInputObjectSchema),
      ]),
    })
    .strict()

export const Scope3UpsertWithWhereUniqueWithoutMetadataInputObjectSchema =
  Schema
