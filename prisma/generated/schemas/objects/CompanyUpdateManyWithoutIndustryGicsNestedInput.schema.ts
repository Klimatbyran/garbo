import { z } from 'zod'
import { CompanyCreateWithoutIndustryGicsInputObjectSchema } from './CompanyCreateWithoutIndustryGicsInput.schema'
import { CompanyUncheckedCreateWithoutIndustryGicsInputObjectSchema } from './CompanyUncheckedCreateWithoutIndustryGicsInput.schema'
import { CompanyCreateOrConnectWithoutIndustryGicsInputObjectSchema } from './CompanyCreateOrConnectWithoutIndustryGicsInput.schema'
import { CompanyUpsertWithWhereUniqueWithoutIndustryGicsInputObjectSchema } from './CompanyUpsertWithWhereUniqueWithoutIndustryGicsInput.schema'
import { CompanyWhereUniqueInputObjectSchema } from './CompanyWhereUniqueInput.schema'
import { CompanyUpdateWithWhereUniqueWithoutIndustryGicsInputObjectSchema } from './CompanyUpdateWithWhereUniqueWithoutIndustryGicsInput.schema'
import { CompanyUpdateManyWithWhereWithoutIndustryGicsInputObjectSchema } from './CompanyUpdateManyWithWhereWithoutIndustryGicsInput.schema'
import { CompanyScalarWhereInputObjectSchema } from './CompanyScalarWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyUpdateManyWithoutIndustryGicsNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => CompanyCreateWithoutIndustryGicsInputObjectSchema),
          z
            .lazy(() => CompanyCreateWithoutIndustryGicsInputObjectSchema)
            .array(),
          z.lazy(
            () => CompanyUncheckedCreateWithoutIndustryGicsInputObjectSchema
          ),
          z
            .lazy(
              () => CompanyUncheckedCreateWithoutIndustryGicsInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () => CompanyCreateOrConnectWithoutIndustryGicsInputObjectSchema
          ),
          z
            .lazy(
              () => CompanyCreateOrConnectWithoutIndustryGicsInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(
            () =>
              CompanyUpsertWithWhereUniqueWithoutIndustryGicsInputObjectSchema
          ),
          z
            .lazy(
              () =>
                CompanyUpsertWithWhereUniqueWithoutIndustryGicsInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      set: z
        .union([
          z.lazy(() => CompanyWhereUniqueInputObjectSchema),
          z.lazy(() => CompanyWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => CompanyWhereUniqueInputObjectSchema),
          z.lazy(() => CompanyWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => CompanyWhereUniqueInputObjectSchema),
          z.lazy(() => CompanyWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => CompanyWhereUniqueInputObjectSchema),
          z.lazy(() => CompanyWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(
            () =>
              CompanyUpdateWithWhereUniqueWithoutIndustryGicsInputObjectSchema
          ),
          z
            .lazy(
              () =>
                CompanyUpdateWithWhereUniqueWithoutIndustryGicsInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () => CompanyUpdateManyWithWhereWithoutIndustryGicsInputObjectSchema
          ),
          z
            .lazy(
              () =>
                CompanyUpdateManyWithWhereWithoutIndustryGicsInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => CompanyScalarWhereInputObjectSchema),
          z.lazy(() => CompanyScalarWhereInputObjectSchema).array(),
        ])
        .optional(),
    })
    .strict()

export const CompanyUpdateManyWithoutIndustryGicsNestedInputObjectSchema =
  Schema
