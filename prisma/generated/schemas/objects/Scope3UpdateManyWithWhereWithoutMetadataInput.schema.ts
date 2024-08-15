import { z } from 'zod'
import { Scope3ScalarWhereInputObjectSchema } from './Scope3ScalarWhereInput.schema'
import { Scope3UpdateManyMutationInputObjectSchema } from './Scope3UpdateManyMutationInput.schema'
import { Scope3UncheckedUpdateManyWithoutScope3InputObjectSchema } from './Scope3UncheckedUpdateManyWithoutScope3Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3UpdateManyWithWhereWithoutMetadataInput> =
  z
    .object({
      where: z.lazy(() => Scope3ScalarWhereInputObjectSchema),
      data: z.union([
        z.lazy(() => Scope3UpdateManyMutationInputObjectSchema),
        z.lazy(() => Scope3UncheckedUpdateManyWithoutScope3InputObjectSchema),
      ]),
    })
    .strict()

export const Scope3UpdateManyWithWhereWithoutMetadataInputObjectSchema = Schema
