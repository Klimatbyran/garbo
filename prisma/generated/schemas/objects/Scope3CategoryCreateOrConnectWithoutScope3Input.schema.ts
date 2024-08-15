import { z } from 'zod'
import { Scope3CategoryWhereUniqueInputObjectSchema } from './Scope3CategoryWhereUniqueInput.schema'
import { Scope3CategoryCreateWithoutScope3InputObjectSchema } from './Scope3CategoryCreateWithoutScope3Input.schema'
import { Scope3CategoryUncheckedCreateWithoutScope3InputObjectSchema } from './Scope3CategoryUncheckedCreateWithoutScope3Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CategoryCreateOrConnectWithoutScope3Input> =
  z
    .object({
      where: z.lazy(() => Scope3CategoryWhereUniqueInputObjectSchema),
      create: z.union([
        z.lazy(() => Scope3CategoryCreateWithoutScope3InputObjectSchema),
        z.lazy(
          () => Scope3CategoryUncheckedCreateWithoutScope3InputObjectSchema
        ),
      ]),
    })
    .strict()

export const Scope3CategoryCreateOrConnectWithoutScope3InputObjectSchema =
  Schema
