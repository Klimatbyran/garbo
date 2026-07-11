import { describe, expect, it } from '@jest/globals'
import { registryReportTypeChanged } from '../src/workers/diffReportType.js'

describe('registryReportTypeChanged', () => {
  it('returns true when setting a type on an untyped report', () => {
    expect(registryReportTypeChanged(null, 'type_1')).toBe(true)
  })

  it('returns true when changing an existing type', () => {
    expect(registryReportTypeChanged('type_1', 'type_2')).toBe(true)
  })

  it('returns false when the type is unchanged', () => {
    expect(registryReportTypeChanged('type_1', 'type_1')).toBe(false)
  })
})
