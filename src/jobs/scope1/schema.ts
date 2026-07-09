import { z } from 'zod'
import { emissionUnitSchemaGarbo } from '@/api/schemas'
import { sourceReferenceFields } from '@/lib/sourceReferenceSchema'

const scope1ValueSchema = z
  .object({
    total: z.number(),
    unit: emissionUnitSchemaGarbo,
    ...sourceReferenceFields,
  })
  .nullable()

const scope1And2ValueSchema = z
  .object({
    total: z.number(),
    unit: emissionUnitSchemaGarbo,
    ...sourceReferenceFields,
  })
  .describe('The combined scope 1 and 2 emissions, if other fields are not available')
  .nullable()

export const schema = z.object({
  scope1: z.array(
    z.object({
      absoluteMostRecentYearInReport: z.number(),
      year: z.number(),
      ...sourceReferenceFields,
      listOfAllPossibleScope1Numbers: z.union([
        z.array(
          z.object({
            number: z.number(),
            unit: z.string(
              z.enum([
                'tCO2e',
                'tCO2',
                'tCO2e/m2',
                'tCO2/m2',
                'tCO2e/revenue',
                'tCO2/revenue',
                'other',
              ])
            ),
            comment: z.string(),
            sourceText: z.string(),
            titleOfTableOrSectionJustAboveThisNumber: z.string(),
            absoluteValueOrPerSomething: z.enum(['absolute', 'perSomething']),
            appliesTowholeCompanyOrJustPartOfCompany: z.enum([
              'wholeCompany',
              'partOfCompany',
            ]),
          })
        ),
        z.enum(['none']),
      ]),
      numbersToSummarizeToGetTotalScope1: z
        .union([z.array(z.number()), z.null()])
        .nullable()
        .optional(),
      scope1: z.union([scope1ValueSchema, z.null()]).optional(),
      scope1And2: z.union([scope1And2ValueSchema, z.null()]).optional(),
    })
  ),
})
