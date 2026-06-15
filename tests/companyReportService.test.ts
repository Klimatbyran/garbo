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

  it('upserts CompanyReport from registry when identity is present', async () => {
    jest
      .spyOn(registryService, 'upsertReportInRegistry')
      .mockResolvedValueOnce({ id: 'report-1' } as never)
    jest
      .spyOn(prisma.companyReport, 'upsert')
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
    expect(prisma.companyReport.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          companyId_registryReportId: {
            companyId: 'Q1',
            registryReportId: 'report-1',
          },
        },
        create: { companyId: 'Q1', registryReportId: 'report-1' },
        update: {},
      })
    )
  })

  it('falls back to the latest CompanyReport when no report identity', async () => {
    const findFirst = jest
      .spyOn(prisma.companyReport, 'findFirst')
      .mockResolvedValueOnce({
        id: 'cr-legacy',
      } as never)

    const result = await companyReportService.resolveCompanyReportIdForSave(
      { wikidataId: 'Q1', name: 'Acme' },
      [{ year: '2024' }]
    )

    expect(result).toEqual({ companyReportId: 'cr-legacy', inferred: true })
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ reportYear: 'desc' }, { createdAt: 'desc' }],
      })
    )
  })

  it('prepareCompanyReportForPeriodSave resolves id, pdf year, and updates reportYear', async () => {
    jest
      .spyOn(companyReportService, 'resolveCompanyReportIdForSave')
      .mockResolvedValueOnce({ companyReportId: 'cr-1', inferred: false })
    const setYear = jest
      .spyOn(companyReportService, 'setCompanyReportYear')
      .mockResolvedValueOnce(undefined)

    const result = await companyReportService.prepareCompanyReportForPeriodSave(
      { wikidataId: 'Q1', name: 'Acme' },
      [{ year: '2024', reportURL: 'https://example.com/2024.pdf' }],
      {
        bodyCompanyReportId: 'cr-1',
        documentReportYear: '2024',
        reportUrl: 'https://example.com/2024.pdf',
      }
    )

    expect(result).toEqual({
      companyReportId: 'cr-1',
      documentReportYear: '2024',
    })
    expect(setYear).toHaveBeenCalledWith('cr-1', '2024')
  })

  it('companyReportIdForPeriodSave returns default when period has no override', async () => {
    const result = await companyReportService.companyReportIdForPeriodSave(
      'Q1',
      'cr-default',
      undefined,
      '2024'
    )
    expect(result).toBe('cr-default')
  })

  it('ensureCompanyReportRegistryLink sets registryReportId on an unlinked shell', async () => {
    jest.spyOn(prisma.companyReport, 'findUnique').mockResolvedValueOnce({
      registryReportId: null,
      companyId: 'Q1',
    } as never)
    jest
      .spyOn(registryService, 'upsertReportInRegistry')
      .mockResolvedValueOnce({ id: 'report-1' } as never)
    jest.spyOn(prisma.companyReport, 'findFirst').mockResolvedValueOnce(null)
    const update = jest
      .spyOn(prisma.companyReport, 'update')
      .mockResolvedValueOnce({} as never)

    const linked = await companyReportService.ensureCompanyReportRegistryLink(
      'cr-unlinked',
      { wikidataId: 'Q1', name: 'Acme' },
      [
        {
          reportURL: 'https://example.com/sustainability-2024.pdf',
          year: '2024',
        },
      ],
      {
        reportUrl: 'https://example.com/sustainability-2024.pdf',
        documentReportYear: '2024',
      }
    )

    expect(linked).toEqual({
      registryReportId: 'report-1',
      companyReportId: 'cr-unlinked',
    })
    expect(update).toHaveBeenCalledWith({
      where: { id: 'cr-unlinked' },
      data: { registryReportId: 'report-1' },
    })
  })

  it('ensureCompanyReportRegistryLink reassigns periods when registry is on another shell', async () => {
    jest.spyOn(prisma.companyReport, 'findUnique').mockResolvedValueOnce({
      registryReportId: null,
      companyId: 'Q1',
    } as never)
    jest
      .spyOn(registryService, 'upsertReportInRegistry')
      .mockResolvedValueOnce({ id: 'report-1' } as never)
    jest.spyOn(prisma.companyReport, 'findFirst').mockResolvedValueOnce({
      id: 'cr-canonical',
    } as never)
    jest
      .spyOn(prisma.reportingPeriod, 'findFirst')
      .mockResolvedValueOnce({ id: 'period-1' } as never)
      .mockResolvedValueOnce(null)
    const updatePeriod = jest
      .spyOn(prisma.reportingPeriod, 'update')
      .mockResolvedValueOnce({} as never)
    jest.spyOn(prisma.companyReport, 'findUnique').mockResolvedValueOnce({
      registryReportId: null,
      _count: { reportingPeriods: 0 },
    } as never)
    const deleteShell = jest
      .spyOn(prisma.companyReport, 'delete')
      .mockResolvedValueOnce({} as never)

    const linked = await companyReportService.ensureCompanyReportRegistryLink(
      'cr-wrong',
      { wikidataId: 'Q1', name: 'Acme' },
      [
        {
          year: '2024',
          reportURL: 'https://example.com/sustainability-2024.pdf',
        },
      ],
      {
        reportUrl: 'https://example.com/sustainability-2024.pdf',
        documentReportYear: '2024',
      }
    )

    expect(linked).toEqual({
      registryReportId: 'report-1',
      companyReportId: 'cr-canonical',
    })
    expect(updatePeriod).toHaveBeenCalledWith({
      where: { id: 'period-1' },
      data: { companyReportId: 'cr-canonical' },
    })
    expect(deleteShell).toHaveBeenCalledWith({ where: { id: 'cr-wrong' } })
  })

  it('setCompanyReportRegistryLink updates registryReportId when report belongs to company', async () => {
    jest.spyOn(prisma.companyReport, 'findFirst').mockResolvedValueOnce({
      id: 'cr-1',
    } as never)
    jest.spyOn(prisma.report, 'findUnique').mockResolvedValueOnce({
      id: 'report-1',
      wikidataId: 'Q1',
    } as never)
    jest.spyOn(prisma.companyReport, 'findFirst').mockResolvedValueOnce(null)
    const update = jest
      .spyOn(prisma.companyReport, 'update')
      .mockResolvedValueOnce({} as never)

    await companyReportService.setCompanyReportRegistryLink(
      'cr-1',
      'Q1',
      'report-1'
    )

    expect(update).toHaveBeenCalledWith({
      where: { id: 'cr-1' },
      data: { registryReportId: 'report-1' },
    })
  })

  it('resolveCompanyReportIdForSave uses period reportURL when top-level url is missing', async () => {
    jest
      .spyOn(registryService, 'upsertReportInRegistry')
      .mockResolvedValueOnce({ id: 'report-1' } as never)
    jest
      .spyOn(prisma.companyReport, 'upsert')
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
  })

  it('companyReportIdForPeriodSave uses period override and sets year when different', async () => {
    jest.spyOn(prisma.companyReport, 'findFirst').mockResolvedValueOnce({
      id: 'cr-other',
    } as never)
    const setYear = jest
      .spyOn(companyReportService, 'setCompanyReportYear')
      .mockResolvedValueOnce(undefined)

    const result = await companyReportService.companyReportIdForPeriodSave(
      'Q1',
      'cr-default',
      'cr-other',
      '2025'
    )

    expect(result).toBe('cr-other')
    expect(setYear).toHaveBeenCalledWith('cr-other', '2025')
  })
})
