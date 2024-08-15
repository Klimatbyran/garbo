import { z } from 'zod'
import { Scope3CategoryScalarWhereInputObjectSchema } from './Scope3CategoryScalarWhereInput.schema'
import { Scope3CategoryUpdateManyMutationInputObjectSchema } from './Scope3CategoryUpdateManyMutationInput.schema'
import { Scope3CategoryUncheckedUpdateManyWithoutCategoriesInputObjectSchema } from './Scope3CategoryUncheckedUpdateManyWithoutCategoriesInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CategoryUpdateManyWithWhereWithoutScope3Input> =
  z
    .object({
      where: z.lazy(() => Scope3CategoryScalarWhereInputObjectSchema),
      data: z.union([
        z.lazy(() => Scope3CategoryUpdateManyMutationInputObjectSchema),
        z.lazy(
          () =>
            Scope3CategoryUncheckedUpdateManyWithoutCategoriesInputObjectSchema
        ),
      ]),
    })
    .strict()

export const Scope3CategoryUpdateManyWithWhereWithoutScope3InputObjectSchema =
  Schema
