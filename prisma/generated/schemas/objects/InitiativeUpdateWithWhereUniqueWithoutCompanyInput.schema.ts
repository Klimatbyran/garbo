import { z } from 'zod'
import { InitiativeWhereUniqueInputObjectSchema } from './InitiativeWhereUniqueInput.schema'
import { InitiativeUpdateWithoutCompanyInputObjectSchema } from './InitiativeUpdateWithoutCompanyInput.schema'
import { InitiativeUncheckedUpdateWithoutCompanyInputObjectSchema } from './InitiativeUncheckedUpdateWithoutCompanyInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.InitiativeUpdateWithWhereUniqueWithoutCompanyInput> =
  z
    .object({
      where: z.lazy(() => InitiativeWhereUniqueInputObjectSchema),
      data: z.union([
        z.lazy(() => InitiativeUpdateWithoutCompanyInputObjectSchema),
        z.lazy(() => InitiativeUncheckedUpdateWithoutCompanyInputObjectSchema),
      ]),
    })
    .strict()

export const InitiativeUpdateWithWhereUniqueWithoutCompanyInputObjectSchema =
  Schema
