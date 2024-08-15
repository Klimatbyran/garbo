import { z } from 'zod'
import { InitiativeScalarWhereInputObjectSchema } from './InitiativeScalarWhereInput.schema'
import { InitiativeUpdateManyMutationInputObjectSchema } from './InitiativeUpdateManyMutationInput.schema'
import { InitiativeUncheckedUpdateManyWithoutInitiativeInputObjectSchema } from './InitiativeUncheckedUpdateManyWithoutInitiativeInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.InitiativeUpdateManyWithWhereWithoutMetadataInput> =
  z
    .object({
      where: z.lazy(() => InitiativeScalarWhereInputObjectSchema),
      data: z.union([
        z.lazy(() => InitiativeUpdateManyMutationInputObjectSchema),
        z.lazy(
          () => InitiativeUncheckedUpdateManyWithoutInitiativeInputObjectSchema
        ),
      ]),
    })
    .strict()

export const InitiativeUpdateManyWithWhereWithoutMetadataInputObjectSchema =
  Schema
