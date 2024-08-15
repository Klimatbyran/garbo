import { z } from 'zod'
import { Scope1ScalarWhereInputObjectSchema } from './Scope1ScalarWhereInput.schema'
import { Scope1UpdateManyMutationInputObjectSchema } from './Scope1UpdateManyMutationInput.schema'
import { Scope1UncheckedUpdateManyWithoutScope1InputObjectSchema } from './Scope1UncheckedUpdateManyWithoutScope1Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope1UpdateManyWithWhereWithoutMetadataInput> =
  z
    .object({
      where: z.lazy(() => Scope1ScalarWhereInputObjectSchema),
      data: z.union([
        z.lazy(() => Scope1UpdateManyMutationInputObjectSchema),
        z.lazy(() => Scope1UncheckedUpdateManyWithoutScope1InputObjectSchema),
      ]),
    })
    .strict()

export const Scope1UpdateManyWithWhereWithoutMetadataInputObjectSchema = Schema
