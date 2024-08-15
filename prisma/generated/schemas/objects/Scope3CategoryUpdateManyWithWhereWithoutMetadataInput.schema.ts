import { z } from 'zod'
import { Scope3CategoryScalarWhereInputObjectSchema } from './Scope3CategoryScalarWhereInput.schema'
import { Scope3CategoryUpdateManyMutationInputObjectSchema } from './Scope3CategoryUpdateManyMutationInput.schema'
import { Scope3CategoryUncheckedUpdateManyWithoutScope3CategoryInputObjectSchema } from './Scope3CategoryUncheckedUpdateManyWithoutScope3CategoryInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CategoryUpdateManyWithWhereWithoutMetadataInput> =
  z
    .object({
      where: z.lazy(() => Scope3CategoryScalarWhereInputObjectSchema),
      data: z.union([
        z.lazy(() => Scope3CategoryUpdateManyMutationInputObjectSchema),
        z.lazy(
          () =>
            Scope3CategoryUncheckedUpdateManyWithoutScope3CategoryInputObjectSchema
        ),
      ]),
    })
    .strict()

export const Scope3CategoryUpdateManyWithWhereWithoutMetadataInputObjectSchema =
  Schema
