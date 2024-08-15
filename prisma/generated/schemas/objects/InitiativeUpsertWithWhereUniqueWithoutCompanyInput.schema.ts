import { z } from 'zod'
import { InitiativeWhereUniqueInputObjectSchema } from './InitiativeWhereUniqueInput.schema'
import { InitiativeUpdateWithoutCompanyInputObjectSchema } from './InitiativeUpdateWithoutCompanyInput.schema'
import { InitiativeUncheckedUpdateWithoutCompanyInputObjectSchema } from './InitiativeUncheckedUpdateWithoutCompanyInput.schema'
import { InitiativeCreateWithoutCompanyInputObjectSchema } from './InitiativeCreateWithoutCompanyInput.schema'
import { InitiativeUncheckedCreateWithoutCompanyInputObjectSchema } from './InitiativeUncheckedCreateWithoutCompanyInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.InitiativeUpsertWithWhereUniqueWithoutCompanyInput> =
  z
    .object({
      where: z.lazy(() => InitiativeWhereUniqueInputObjectSchema),
      update: z.union([
        z.lazy(() => InitiativeUpdateWithoutCompanyInputObjectSchema),
        z.lazy(() => InitiativeUncheckedUpdateWithoutCompanyInputObjectSchema),
      ]),
      create: z.union([
        z.lazy(() => InitiativeCreateWithoutCompanyInputObjectSchema),
        z.lazy(() => InitiativeUncheckedCreateWithoutCompanyInputObjectSchema),
      ]),
    })
    .strict()

export const InitiativeUpsertWithWhereUniqueWithoutCompanyInputObjectSchema =
  Schema
