import { z } from 'zod'
import { EconomyScalarWhereInputObjectSchema } from './EconomyScalarWhereInput.schema'
import { EconomyUpdateManyMutationInputObjectSchema } from './EconomyUpdateManyMutationInput.schema'
import { EconomyUncheckedUpdateManyWithoutEconomyInputObjectSchema } from './EconomyUncheckedUpdateManyWithoutEconomyInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EconomyUpdateManyWithWhereWithoutMetadataInput> =
  z
    .object({
      where: z.lazy(() => EconomyScalarWhereInputObjectSchema),
      data: z.union([
        z.lazy(() => EconomyUpdateManyMutationInputObjectSchema),
        z.lazy(() => EconomyUncheckedUpdateManyWithoutEconomyInputObjectSchema),
      ]),
    })
    .strict()

export const EconomyUpdateManyWithWhereWithoutMetadataInputObjectSchema = Schema
