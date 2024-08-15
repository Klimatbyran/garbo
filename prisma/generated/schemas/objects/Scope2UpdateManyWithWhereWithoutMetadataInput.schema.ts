import { z } from 'zod'
import { Scope2ScalarWhereInputObjectSchema } from './Scope2ScalarWhereInput.schema'
import { Scope2UpdateManyMutationInputObjectSchema } from './Scope2UpdateManyMutationInput.schema'
import { Scope2UncheckedUpdateManyWithoutScope2InputObjectSchema } from './Scope2UncheckedUpdateManyWithoutScope2Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope2UpdateManyWithWhereWithoutMetadataInput> =
  z
    .object({
      where: z.lazy(() => Scope2ScalarWhereInputObjectSchema),
      data: z.union([
        z.lazy(() => Scope2UpdateManyMutationInputObjectSchema),
        z.lazy(() => Scope2UncheckedUpdateManyWithoutScope2InputObjectSchema),
      ]),
    })
    .strict()

export const Scope2UpdateManyWithWhereWithoutMetadataInputObjectSchema = Schema
