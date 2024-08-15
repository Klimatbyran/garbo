import { z } from 'zod'
import { InitiativeScalarWhereInputObjectSchema } from './InitiativeScalarWhereInput.schema'
import { InitiativeUpdateManyMutationInputObjectSchema } from './InitiativeUpdateManyMutationInput.schema'
import { InitiativeUncheckedUpdateManyWithoutInitiativesInputObjectSchema } from './InitiativeUncheckedUpdateManyWithoutInitiativesInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.InitiativeUpdateManyWithWhereWithoutCompanyInput> =
  z
    .object({
      where: z.lazy(() => InitiativeScalarWhereInputObjectSchema),
      data: z.union([
        z.lazy(() => InitiativeUpdateManyMutationInputObjectSchema),
        z.lazy(
          () => InitiativeUncheckedUpdateManyWithoutInitiativesInputObjectSchema
        ),
      ]),
    })
    .strict()

export const InitiativeUpdateManyWithWhereWithoutCompanyInputObjectSchema =
  Schema
