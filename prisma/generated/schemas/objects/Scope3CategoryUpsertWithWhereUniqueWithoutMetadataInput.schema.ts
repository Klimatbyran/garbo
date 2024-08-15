import { z } from 'zod'
import { Scope3CategoryWhereUniqueInputObjectSchema } from './Scope3CategoryWhereUniqueInput.schema'
import { Scope3CategoryUpdateWithoutMetadataInputObjectSchema } from './Scope3CategoryUpdateWithoutMetadataInput.schema'
import { Scope3CategoryUncheckedUpdateWithoutMetadataInputObjectSchema } from './Scope3CategoryUncheckedUpdateWithoutMetadataInput.schema'
import { Scope3CategoryCreateWithoutMetadataInputObjectSchema } from './Scope3CategoryCreateWithoutMetadataInput.schema'
import { Scope3CategoryUncheckedCreateWithoutMetadataInputObjectSchema } from './Scope3CategoryUncheckedCreateWithoutMetadataInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CategoryUpsertWithWhereUniqueWithoutMetadataInput> =
  z
    .object({
      where: z.lazy(() => Scope3CategoryWhereUniqueInputObjectSchema),
      update: z.union([
        z.lazy(() => Scope3CategoryUpdateWithoutMetadataInputObjectSchema),
        z.lazy(
          () => Scope3CategoryUncheckedUpdateWithoutMetadataInputObjectSchema
        ),
      ]),
      create: z.union([
        z.lazy(() => Scope3CategoryCreateWithoutMetadataInputObjectSchema),
        z.lazy(
          () => Scope3CategoryUncheckedCreateWithoutMetadataInputObjectSchema
        ),
      ]),
    })
    .strict()

export const Scope3CategoryUpsertWithWhereUniqueWithoutMetadataInputObjectSchema =
  Schema
