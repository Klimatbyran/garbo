import {
  registryDeleteResponseSchema,
  registryUpdateRequestBodySchema,
} from '../src/api/schemas'

describe('Registry schemas', () => {
  test('registry update requires at least one editable field besides id', () => {
    const noUpdateFields = registryUpdateRequestBodySchema.safeParse({
      id: 'report_123',
    })

    expect(noUpdateFields.success).toBe(false)

    const withUpdateField = registryUpdateRequestBodySchema.safeParse({
      id: 'report_123',
      companyName: 'Acme Corp',
    })

    expect(withUpdateField.success).toBe(true)
  })

  test('registry delete response accepts wikidataId', () => {
    const payload = {
      message: 'Successfully deleted 1 report(s)',
      deletedReports: [
        {
          id: 'report_123',
          companyName: 'Acme Corp',
          wikidataId: 'Q12345',
          reportYear: '2024',
          url: 'https://example.com/report.pdf',
        },
      ],
    }

    const result = registryDeleteResponseSchema.safeParse(payload)
    expect(result.success).toBe(true)
  })
})
