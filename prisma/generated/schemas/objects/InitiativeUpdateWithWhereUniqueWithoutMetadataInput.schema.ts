import { z } from 'zod'
import { InitiativeWhereUniqueInputObjectSchema } from './InitiativeWhereUniqueInput.schema'
import { InitiativeUpdateWithoutMetadataInputObjectSchema } from './InitiativeUpdateWithoutMetadataInput.schema'
import { InitiativeUncheckedUpdateWithoutMetadataInputObjectSchema } from './InitiativeUncheckedUpdateWithoutMetadataInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.InitiativeUpdateWithWhereUniqueWithoutMetadataInput> =
  z
    .object({
      where: z.lazy(() => InitiativeWhereUniqueInputObjectSchema),
      data: z.union([
        z.lazy(() => InitiativeUpdateWithoutMetadataInputObjectSchema),
        z.lazy(() => InitiativeUncheckedUpdateWithoutMetadataInputObjectSchema),
      ]),
    })
    .strict()

export const InitiativeUpdateWithWhereUniqueWithoutMetadataInputObjectSchema =
  Schema
