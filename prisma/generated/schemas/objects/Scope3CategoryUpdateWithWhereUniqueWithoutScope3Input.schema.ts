import { z } from 'zod'
import { Scope3CategoryWhereUniqueInputObjectSchema } from './Scope3CategoryWhereUniqueInput.schema'
import { Scope3CategoryUpdateWithoutScope3InputObjectSchema } from './Scope3CategoryUpdateWithoutScope3Input.schema'
import { Scope3CategoryUncheckedUpdateWithoutScope3InputObjectSchema } from './Scope3CategoryUncheckedUpdateWithoutScope3Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CategoryUpdateWithWhereUniqueWithoutScope3Input> =
  z
    .object({
      where: z.lazy(() => Scope3CategoryWhereUniqueInputObjectSchema),
      data: z.union([
        z.lazy(() => Scope3CategoryUpdateWithoutScope3InputObjectSchema),
        z.lazy(
          () => Scope3CategoryUncheckedUpdateWithoutScope3InputObjectSchema
        ),
      ]),
    })
    .strict()

export const Scope3CategoryUpdateWithWhereUniqueWithoutScope3InputObjectSchema =
  Schema
