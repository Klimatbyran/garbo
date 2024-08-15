import { z } from 'zod'
import { Scope3WhereUniqueInputObjectSchema } from './Scope3WhereUniqueInput.schema'
import { Scope3CreateWithoutMetadataInputObjectSchema } from './Scope3CreateWithoutMetadataInput.schema'
import { Scope3UncheckedCreateWithoutMetadataInputObjectSchema } from './Scope3UncheckedCreateWithoutMetadataInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CreateOrConnectWithoutMetadataInput> = z
  .object({
    where: z.lazy(() => Scope3WhereUniqueInputObjectSchema),
    create: z.union([
      z.lazy(() => Scope3CreateWithoutMetadataInputObjectSchema),
      z.lazy(() => Scope3UncheckedCreateWithoutMetadataInputObjectSchema),
    ]),
  })
  .strict()

export const Scope3CreateOrConnectWithoutMetadataInputObjectSchema = Schema
