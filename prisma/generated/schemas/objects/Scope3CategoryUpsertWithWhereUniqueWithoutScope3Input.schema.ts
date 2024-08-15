import { z } from 'zod'
import { Scope3CategoryWhereUniqueInputObjectSchema } from './Scope3CategoryWhereUniqueInput.schema'
import { Scope3CategoryUpdateWithoutScope3InputObjectSchema } from './Scope3CategoryUpdateWithoutScope3Input.schema'
import { Scope3CategoryUncheckedUpdateWithoutScope3InputObjectSchema } from './Scope3CategoryUncheckedUpdateWithoutScope3Input.schema'
import { Scope3CategoryCreateWithoutScope3InputObjectSchema } from './Scope3CategoryCreateWithoutScope3Input.schema'
import { Scope3CategoryUncheckedCreateWithoutScope3InputObjectSchema } from './Scope3CategoryUncheckedCreateWithoutScope3Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CategoryUpsertWithWhereUniqueWithoutScope3Input> =
  z
    .object({
      where: z.lazy(() => Scope3CategoryWhereUniqueInputObjectSchema),
      update: z.union([
        z.lazy(() => Scope3CategoryUpdateWithoutScope3InputObjectSchema),
        z.lazy(
          () => Scope3CategoryUncheckedUpdateWithoutScope3InputObjectSchema
        ),
      ]),
      create: z.union([
        z.lazy(() => Scope3CategoryCreateWithoutScope3InputObjectSchema),
        z.lazy(
          () => Scope3CategoryUncheckedCreateWithoutScope3InputObjectSchema
        ),
      ]),
    })
    .strict()

export const Scope3CategoryUpsertWithWhereUniqueWithoutScope3InputObjectSchema =
  Schema
