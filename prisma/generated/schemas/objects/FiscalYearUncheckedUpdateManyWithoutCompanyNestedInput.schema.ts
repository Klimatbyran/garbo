import { z } from 'zod'
import { FiscalYearCreateWithoutCompanyInputObjectSchema } from './FiscalYearCreateWithoutCompanyInput.schema'
import { FiscalYearUncheckedCreateWithoutCompanyInputObjectSchema } from './FiscalYearUncheckedCreateWithoutCompanyInput.schema'
import { FiscalYearCreateOrConnectWithoutCompanyInputObjectSchema } from './FiscalYearCreateOrConnectWithoutCompanyInput.schema'
import { FiscalYearUpsertWithWhereUniqueWithoutCompanyInputObjectSchema } from './FiscalYearUpsertWithWhereUniqueWithoutCompanyInput.schema'
import { FiscalYearWhereUniqueInputObjectSchema } from './FiscalYearWhereUniqueInput.schema'
import { FiscalYearUpdateWithWhereUniqueWithoutCompanyInputObjectSchema } from './FiscalYearUpdateWithWhereUniqueWithoutCompanyInput.schema'
import { FiscalYearUpdateManyWithWhereWithoutCompanyInputObjectSchema } from './FiscalYearUpdateManyWithWhereWithoutCompanyInput.schema'
import { FiscalYearScalarWhereInputObjectSchema } from './FiscalYearScalarWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.FiscalYearUncheckedUpdateManyWithoutCompanyNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => FiscalYearCreateWithoutCompanyInputObjectSchema),
          z.lazy(() => FiscalYearCreateWithoutCompanyInputObjectSchema).array(),
          z.lazy(
            () => FiscalYearUncheckedCreateWithoutCompanyInputObjectSchema
          ),
          z
            .lazy(
              () => FiscalYearUncheckedCreateWithoutCompanyInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () => FiscalYearCreateOrConnectWithoutCompanyInputObjectSchema
          ),
          z
            .lazy(
              () => FiscalYearCreateOrConnectWithoutCompanyInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(
            () => FiscalYearUpsertWithWhereUniqueWithoutCompanyInputObjectSchema
          ),
          z
            .lazy(
              () =>
                FiscalYearUpsertWithWhereUniqueWithoutCompanyInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      set: z
        .union([
          z.lazy(() => FiscalYearWhereUniqueInputObjectSchema),
          z.lazy(() => FiscalYearWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => FiscalYearWhereUniqueInputObjectSchema),
          z.lazy(() => FiscalYearWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => FiscalYearWhereUniqueInputObjectSchema),
          z.lazy(() => FiscalYearWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => FiscalYearWhereUniqueInputObjectSchema),
          z.lazy(() => FiscalYearWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(
            () => FiscalYearUpdateWithWhereUniqueWithoutCompanyInputObjectSchema
          ),
          z
            .lazy(
              () =>
                FiscalYearUpdateWithWhereUniqueWithoutCompanyInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () => FiscalYearUpdateManyWithWhereWithoutCompanyInputObjectSchema
          ),
          z
            .lazy(
              () => FiscalYearUpdateManyWithWhereWithoutCompanyInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => FiscalYearScalarWhereInputObjectSchema),
          z.lazy(() => FiscalYearScalarWhereInputObjectSchema).array(),
        ])
        .optional(),
    })
    .strict()

export const FiscalYearUncheckedUpdateManyWithoutCompanyNestedInputObjectSchema =
  Schema
