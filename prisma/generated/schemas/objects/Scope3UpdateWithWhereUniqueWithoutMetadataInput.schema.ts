import { z } from 'zod'
import { Scope3WhereUniqueInputObjectSchema } from './Scope3WhereUniqueInput.schema'
import { Scope3UpdateWithoutMetadataInputObjectSchema } from './Scope3UpdateWithoutMetadataInput.schema'
import { Scope3UncheckedUpdateWithoutMetadataInputObjectSchema } from './Scope3UncheckedUpdateWithoutMetadataInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3UpdateWithWhereUniqueWithoutMetadataInput> =
  z
    .object({
      where: z.lazy(() => Scope3WhereUniqueInputObjectSchema),
      data: z.union([
        z.lazy(() => Scope3UpdateWithoutMetadataInputObjectSchema),
        z.lazy(() => Scope3UncheckedUpdateWithoutMetadataInputObjectSchema),
      ]),
    })
    .strict()

export const Scope3UpdateWithWhereUniqueWithoutMetadataInputObjectSchema =
  Schema
