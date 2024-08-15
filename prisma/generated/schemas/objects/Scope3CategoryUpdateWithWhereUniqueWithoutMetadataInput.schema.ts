import { z } from 'zod'
import { Scope3CategoryWhereUniqueInputObjectSchema } from './Scope3CategoryWhereUniqueInput.schema'
import { Scope3CategoryUpdateWithoutMetadataInputObjectSchema } from './Scope3CategoryUpdateWithoutMetadataInput.schema'
import { Scope3CategoryUncheckedUpdateWithoutMetadataInputObjectSchema } from './Scope3CategoryUncheckedUpdateWithoutMetadataInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CategoryUpdateWithWhereUniqueWithoutMetadataInput> =
  z
    .object({
      where: z.lazy(() => Scope3CategoryWhereUniqueInputObjectSchema),
      data: z.union([
        z.lazy(() => Scope3CategoryUpdateWithoutMetadataInputObjectSchema),
        z.lazy(
          () => Scope3CategoryUncheckedUpdateWithoutMetadataInputObjectSchema
        ),
      ]),
    })
    .strict()

export const Scope3CategoryUpdateWithWhereUniqueWithoutMetadataInputObjectSchema =
  Schema
