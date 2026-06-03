import { jest } from '@jest/globals'

import { prisma } from '../src/lib/prisma'
import {
  companyReportService,
  CompanyReportScopeError,
} from '../src/api/services/companyReportService'
import { registryService } from '../src/api/services/registryService'

describe('companyReportService', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns explicit companyReportId when it belongs to the company', async () => {
    jest.spyOn(prisma.companyReport, 'findFirst').mockResolvedValueOnce({
      id: 'cr-1',
    } as never)

    const result = await companyReportService.resolveCompanyReportIdForSave(
      { wikidataId: 'Q1', name: 'Acme' },
      [{ reportURL: 'https://example.com/2024.pdf', year: '2024' }],
      { companyReportId: 'cr-1' }
    )

    expect(result).toEqual({ companyReportId: 'cr-1', inferred: false })
  })

  it('throws when explicit companyReportId is out of scope', async () => {
    jest.spyOn(prisma.companyReport, 'findFirst').mockResolvedValueOnce(null)

    await expect(
      companyReportService.resolveCompanyReportIdForSave(
        { wikidataId: 'Q1', name: 'Acme' },
        [{ year: '2024' }],
        { companyReportId: 'cr-other' }
      )
    ).rejects.toBeInstanceOf(CompanyReportScopeError)
  })

  it('creates CompanyReport from registry upsert when identity is present', async () => {
    jest
      .spyOn(registryService, 'upsertReportInRegistry')
      .mockResolvedValueOnce({ id: 'report-1' } as never)
    jest
      .spyOn(prisma.companyReport, 'findFirst')
      .mockResolvedValueOnce(null)
    jest
      .spyOn(prisma.companyReport, 'create')
      .mockResolvedValueOnce({ id: 'cr-new' } as never)

    const result = await companyReportService.resolveCompanyReportIdForSave(
      { wikidataId: 'Q1', name: 'Acme' },
      [
        {
          reportURL: 'https://example.com/sustainability-2024.pdf',
          year: '2024',
        },
      ]
    )

    expect(result).toEqual({ companyReportId: 'cr-new', inferred: true })
    expect(registryService.upsertReportInRegistry).toHaveBeenCalled()
    expect(prisma.companyReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { companyId: 'Q1', registryReportId: 'report-1' },
      })
    )
  })

  it('falls back to the newest company shell when no report identity', async () => {
    jest.spyOn(prisma.companyReport, 'findFirst').mockResolvedValueOnce({
      id: 'cr-legacy',
    } as never)

    const result = await companyReportService.resolveCompanyReportIdForSave(
      { wikidataId: 'Q1', name: 'Acme' },
      [{ year: '2024' }]
    )

    expect(result).toEqual({ companyReportId: 'cr-legacy', inferred: true })
  })
})
