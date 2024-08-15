import { z } from 'zod'
import { InitiativeWhereUniqueInputObjectSchema } from './InitiativeWhereUniqueInput.schema'
import { InitiativeCreateWithoutCompanyInputObjectSchema } from './InitiativeCreateWithoutCompanyInput.schema'
import { InitiativeUncheckedCreateWithoutCompanyInputObjectSchema } from './InitiativeUncheckedCreateWithoutCompanyInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.InitiativeCreateOrConnectWithoutCompanyInput> = z
  .object({
    where: z.lazy(() => InitiativeWhereUniqueInputObjectSchema),
    create: z.union([
      z.lazy(() => InitiativeCreateWithoutCompanyInputObjectSchema),
      z.lazy(() => InitiativeUncheckedCreateWithoutCompanyInputObjectSchema),
    ]),
  })
  .strict()

export const InitiativeCreateOrConnectWithoutCompanyInputObjectSchema = Schema
