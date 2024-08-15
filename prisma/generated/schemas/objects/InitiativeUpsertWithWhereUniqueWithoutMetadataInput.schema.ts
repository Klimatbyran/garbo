import { z } from 'zod'
import { InitiativeWhereUniqueInputObjectSchema } from './InitiativeWhereUniqueInput.schema'
import { InitiativeUpdateWithoutMetadataInputObjectSchema } from './InitiativeUpdateWithoutMetadataInput.schema'
import { InitiativeUncheckedUpdateWithoutMetadataInputObjectSchema } from './InitiativeUncheckedUpdateWithoutMetadataInput.schema'
import { InitiativeCreateWithoutMetadataInputObjectSchema } from './InitiativeCreateWithoutMetadataInput.schema'
import { InitiativeUncheckedCreateWithoutMetadataInputObjectSchema } from './InitiativeUncheckedCreateWithoutMetadataInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.InitiativeUpsertWithWhereUniqueWithoutMetadataInput> =
  z
    .object({
      where: z.lazy(() => InitiativeWhereUniqueInputObjectSchema),
      update: z.union([
        z.lazy(() => InitiativeUpdateWithoutMetadataInputObjectSchema),
        z.lazy(() => InitiativeUncheckedUpdateWithoutMetadataInputObjectSchema),
      ]),
      create: z.union([
        z.lazy(() => InitiativeCreateWithoutMetadataInputObjectSchema),
        z.lazy(() => InitiativeUncheckedCreateWithoutMetadataInputObjectSchema),
      ]),
    })
    .strict()

export const InitiativeUpsertWithWhereUniqueWithoutMetadataInputObjectSchema =
  Schema
