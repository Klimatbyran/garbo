import { z } from 'zod'
import { InitiativeWhereUniqueInputObjectSchema } from './InitiativeWhereUniqueInput.schema'
import { InitiativeCreateWithoutMetadataInputObjectSchema } from './InitiativeCreateWithoutMetadataInput.schema'
import { InitiativeUncheckedCreateWithoutMetadataInputObjectSchema } from './InitiativeUncheckedCreateWithoutMetadataInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.InitiativeCreateOrConnectWithoutMetadataInput> =
  z
    .object({
      where: z.lazy(() => InitiativeWhereUniqueInputObjectSchema),
      create: z.union([
        z.lazy(() => InitiativeCreateWithoutMetadataInputObjectSchema),
        z.lazy(() => InitiativeUncheckedCreateWithoutMetadataInputObjectSchema),
      ]),
    })
    .strict()

export const InitiativeCreateOrConnectWithoutMetadataInputObjectSchema = Schema
