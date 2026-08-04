import { FlowProducer } from 'bullmq'
import { PipelineJob, PipelineWorker } from '../lib/PipelineWorker'
import { apiFetch } from '../lib/api'
import redis from '../config/redis'
import apiConfig from '../config/api'
import { getCompanyURL } from '../lib/saveUtils'
import { QUEUE_NAMES } from '../queues'
import {
  getCanonicalCompanyIdForThread,
  getWikidataNodeForThread,
  isCompanyLinkResolutionPendingForThread,
  syncCanonicalReportRunCompanyId,
} from '../lib/pipelineRunCompanyId'
import { resolvePipelineCompanyAfterIdentifiers } from '../lib/pipelineCompanyResolve'
import {
  extractScopeEntriesFromFollowUp,
  mergeScope1AndScope2Results,
} from '../lib/mergeScopeResults'
import { withPipelineJobOpts } from '../lib/pipelineJobOptions'
import { buildEarlyRegistryPayload } from './saveToAPI.utils'
import { registryService } from '../api/services/registryService'
import { companyReportService } from '../api/services/companyReportService'
import {
  companyMutationPath,
  pipelineCompanyReadPath,
} from '../lib/pipelineCompanyPath'
import { preferRicherDiacriticCompanyName } from '../lib/companyLinkResolve'

export class CheckDBJob extends PipelineJob {
  declare data: PipelineJob['data'] & {
    companyName: string
    companyId: string
    /** Original report URL when pipeline cached PDF to S3 (parsePdf). */
    sourceUrl?: string
    /** Cached/uploaded PDF storage metadata from pipeline-api (when available). */
    pdfCache?: {
      publicUrl?: string
      sha256?: string
    }
    /** PDF year from pipeline parse when set on the job. */
    documentReportYear?: string | number
    /** Registry report id from early upsert in this worker (passed to diff/save children). */
    registryReportId?: string
    wikidata?: { node: string }
    fiscalYear: {
      startMonth: number
      endMonth: number
    }
    approved?: boolean
    lei?: string
    replaceAllEmissions?: boolean
    tags?: string[]
  }
}

const flow = new FlowProducer({ connection: redis })
flow.on('error', (err) => console.error('FlowProducer connection error:', err))

const CHECKDB_COMPANY_LINK_SOURCE = 'checkdb-company-resolve'

function isCheckDbSaveTimeCompanyLinkApproval(job: CheckDBJob): boolean {
  const approval = job.data.approval
  if (approval?.type !== 'companyLink') return false
  const source = (approval.metadata as { source?: string } | undefined)?.source
  return source === CHECKDB_COMPANY_LINK_SOURCE
}

const checkDB = new PipelineWorker(
  QUEUE_NAMES.CHECK_DB,
  async (job: CheckDBJob) => {
    const { url, sourceUrl, fiscalYear } = job.data
    let { companyId, wikidata, companyName } = job.data

    const threadId = job.data.threadId?.trim()
    if (threadId && (await isCompanyLinkResolutionPendingForThread(threadId))) {
      job.log(
        'Waiting for company link resolution on guessWikidata before API save'
      )
      await job.moveToDelayed(Date.now() + apiConfig.jobDelay)
      return
    }

    const canonicalCompany = await getCanonicalCompanyIdForThread(
      threadId,
      companyId
    )
    if (canonicalCompany.companyId !== companyId) {
      job.log(
        `Using canonical companyId=${canonicalCompany.companyId} from ${canonicalCompany.source} (job had ${companyId})`
      )
      companyId = canonicalCompany.companyId
      await job.updateData({ ...job.data, companyId })
    }

    if (isCheckDbSaveTimeCompanyLinkApproval(job) && job.isDataApproved()) {
      const approved = job.getApprovedBody()
      if (approved.createNew) {
        throw new Error(
          'Create-new is not allowed when resolving company link before save'
        )
      }
      if (typeof approved.companyId === 'string' && approved.companyId.trim()) {
        companyId = approved.companyId.trim()
        await job.updateData({ ...job.data, companyId })
        job.log(`Using staff-selected company id=${companyId} before save`)
        if (threadId) {
          await syncCanonicalReportRunCompanyId({
            threadId,
            companyId,
            pdfUrl: url,
            companyName,
            wikidataId: wikidata?.node ?? null,
          })
        }
      }
    }

    if (
      isCheckDbSaveTimeCompanyLinkApproval(job) &&
      job.hasApproval() &&
      !job.isDataApproved()
    ) {
      job.log('Waiting for company link approval before API save')
      await job.moveToDelayed(Date.now() + apiConfig.jobDelay)
      return
    }

    const childrenEntries = await job.getChildrenEntries()

    const extractValue = (entry: any) =>
      entry && typeof entry === 'object' && 'value' in entry
        ? entry.value
        : entry

    const root = extractValue(childrenEntries) // <- this is the object that has scope data, economy, etc.

    const {
      scope12: legacyScope12,
      scope1,
      scope2,
      scope3,
      biogenic,
      industry,
      economy,
      baseYear,
      goals,
      initiatives,
      descriptions,
      lei,
      tags: extractedTags,
      reportType: extractedReportType,
    } = root || {}

    // User-provided tags are a starting point; merge with AI-extracted tags when available.
    const userTags = Array.isArray(job.data.tags) ? job.data.tags : []
    const aiTags = Array.isArray(extractedTags) ? extractedTags : []
    const tags = Array.from(new Set([...userTags, ...aiTags])).filter(
      (t) => typeof t === 'string' && t.trim().length > 0
    )

    const mergedScope12 = mergeScope1AndScope2Results(
      extractScopeEntriesFromFollowUp(scope1),
      extractScopeEntriesFromFollowUp(scope2),
      extractScopeEntriesFromFollowUp(legacyScope12)
    )

    const extractedLei =
      typeof lei === 'string' && lei.trim() ? lei.trim() : undefined
    const mergedLei = extractedLei ?? job.data.lei?.trim()
    const wikidataNode =
      wikidata?.node?.trim() ??
      job.data.wikidata?.node?.trim() ??
      (threadId ? await getWikidataNodeForThread(threadId) : undefined)
    const mergedWikidata = wikidataNode ? { node: wikidataNode } : wikidata

    if (mergedLei && mergedLei !== job.data.lei) {
      await job.updateData({ ...job.data, lei: mergedLei })
    }
    if (
      mergedWikidata?.node &&
      mergedWikidata.node !== job.data.wikidata?.node
    ) {
      await job.updateData({ ...job.data, wikidata: mergedWikidata })
      wikidata = mergedWikidata
    }

    const staffResolvedCompanyLink =
      isCheckDbSaveTimeCompanyLinkApproval(job) && job.isDataApproved()

    if (!staffResolvedCompanyLink) {
      const saveResolution = await resolvePipelineCompanyAfterIdentifiers(
        { wikidata: mergedWikidata, lei: mergedLei },
        companyName,
        companyId
      )

      if (saveResolution.status === 'ambiguous') {
        job.log(
          `Ambiguous company link at save for "${companyName}" — ${saveResolution.candidates.length} candidates`
        )
        await job.requestApproval(
          'companyLink',
          {
            type: 'companyLink',
            newValue: {
              extractedName: saveResolution.extractedName,
              candidates: saveResolution.candidates,
              allowCreateNew: false,
            },
          },
          false,
          {
            source: 'checkdb-company-resolve',
            comment:
              'Multiple matching companies found before save — please select the correct company',
          },
          `Company link before save for ${companyName}`
        )
        await job.moveToDelayed(Date.now() + apiConfig.jobDelay)
        return
      }

      if (
        saveResolution.status === 'resolved' &&
        saveResolution.companyId !== companyId
      ) {
        job.log(
          `Re-resolved company for save id=${saveResolution.companyId} method=${saveResolution.method} (was ${companyId})`
        )
        companyId = saveResolution.companyId
        await job.updateData({ ...job.data, companyId })
        if (threadId) {
          await syncCanonicalReportRunCompanyId({
            threadId,
            companyId,
            pdfUrl: url,
            companyName,
            wikidataId: wikidata?.node ?? null,
          })
        }
      }
    } else {
      job.log(
        `Skipping save-time company re-resolve — staff already selected companyId=${companyId}`
      )
    }

    job.sendMessage(`🤖 Checking if ${companyName} already exists in API...`)
    const existingCompany = await apiFetch(
      pipelineCompanyReadPath(companyId)
    ).catch(() => null)
    job.log(existingCompany)

    if (existingCompany) {
      companyName = preferRicherDiacriticCompanyName(
        existingCompany.name,
        companyName
      )
    }

    if (!existingCompany) {
      job.log(
        `Company ${companyId} not returned from pipeline read; syncing name (should exist from precheck)`
      )
      const synced = await apiFetch(companyMutationPath(companyId), {
        body: { name: companyName },
      })
      if (synced === null) {
        throw new Error(
          `Company ${companyId} not found after precheck resolution — cannot continue pipeline`
        )
      }
      await job.sendMessage(
        `✅ Synced company '${companyName}' (${companyId}). See: ${getCompanyURL(companyName, companyId, wikidata?.node)}`
      )
    } else {
      job.log(`✅ The company '${companyName}' was found in the database.`)
      const leiLabel = existingCompany.lei ?? 'none'
      await job.sendMessage(
        `✅ The company '${companyName}' was found in the database, with LEI number '${leiLabel}'`
      )
    }

    // TODO(pipeline): Registry upsert and CompanyReport shell creation moved to checkDB;
    // registryReportId is carried on the job through diff/save. Period save still re-resolves
    // the shell and may reassign periods (ensureCompanyReportRegistryLink). Consider making
    // registryReportId the single source of truth for the run instead of re-inferring at save.
    let registryReportId: string | undefined
    let companyReportId: string | undefined
    let existingReportTypeId: string | null = null
    const earlyRegistryPayload = buildEarlyRegistryPayload({
      companyName,
      wikidata,
      url,
      sourceUrl,
      pdfCache: job.data.pdfCache,
      documentReportYear: job.data.documentReportYear,
    })
    if (earlyRegistryPayload) {
      try {
        const report =
          await registryService.upsertReportInRegistry(earlyRegistryPayload)
        registryReportId = report.id
        existingReportTypeId = report.reportTypeId ?? null
        companyReportId = await companyReportService.findOrCreateCompanyReport(
          companyId,
          report.id
        )
        job.log(`Early registry upsert: ${report.id}`)
      } catch (error: any) {
        job.log(
          `Early registry upsert failed: ${error?.message ?? String(error)}`
        )
      }
    } else {
      job.log(
        'Skipping early registry upsert: no PDF URL identity on job (url/sourceUrl/pdfCache)'
      )
    }

    if (!registryReportId && earlyRegistryPayload) {
      try {
        const existingReport =
          await registryService.findMatchingReportInRegistry(
            earlyRegistryPayload
          )
        if (existingReport) {
          registryReportId = existingReport.id
          existingReportTypeId = existingReport.reportTypeId
          job.log(
            `Resolved registry report for report type update: ${registryReportId}`
          )
        }
      } catch (error: any) {
        job.log(
          `Registry lookup for report type failed: ${error?.message ?? String(error)}`
        )
      }
    }

    const base = {
      name: companyName,
      data: {
        ...job.data,
        existingCompany,
        companyName,
        companyId,
        url,
        sourceUrl,
        fiscalYear,
        wikidata,
        autoApprove: job.data.autoApprove,
        replaceAllEmissions: job.data.replaceAllEmissions,
        batchId: job.data.batchId,
        pdfCache: job.data.pdfCache,
        documentReportYear: job.data.documentReportYear,
        ...(registryReportId && { registryReportId }),
        ...(companyReportId && { companyReportId }),
        ...(registryReportId && { existingReportTypeId }),
      },
      opts: withPipelineJobOpts({
        attempts: 3,
      }),
    }

    await job.editMessage(`🤖 Saving data...`)

    await flow.add({
      ...base,
      queueName: QUEUE_NAMES.SEND_COMPANY_LINK,
      data: {
        ...base.data,
      },
      children: [
        mergedScope12 || scope3 || biogenic || economy
          ? {
              ...base,
              queueName: QUEUE_NAMES.DIFF_REPORTING_PERIODS,
              data: {
                ...base.data,
                scope12: mergedScope12,
                scope3,
                biogenic,
                economy,
              },
            }
          : null,
        industry
          ? {
              ...base,
              queueName: QUEUE_NAMES.DIFF_INDUSTRY,
              data: {
                ...base.data,
                industry,
              },
            }
          : null,
        goals
          ? {
              ...base,
              queueName: QUEUE_NAMES.DIFF_GOALS,
              data: {
                ...base.data,
                goals,
              },
            }
          : null,
        baseYear
          ? {
              ...base,
              queueName: QUEUE_NAMES.DIFF_BASE_YEAR,
              data: {
                ...base.data,
                baseYear,
              },
            }
          : null,
        initiatives
          ? {
              ...base,
              queueName: QUEUE_NAMES.DIFF_INITIATIVES,
              data: {
                ...base.data,
                initiatives,
              },
            }
          : null,
        mergedLei
          ? {
              ...base,
              queueName: QUEUE_NAMES.DIFF_LEI,
              data: {
                ...base.data,
                lei: mergedLei,
              },
            }
          : null,
        descriptions
          ? {
              ...base,
              name: 'diffDescriptions' + companyName,
              queueName: QUEUE_NAMES.DIFF_DESCRIPTIONS,
              data: {
                ...job.data,
                fiscalYear: undefined,
                companyId,
                companyName,
                existingCompany,
                existingDescriptions: existingCompany?.descriptions,
                descriptions: descriptions,
              },
            }
          : null,
        tags?.length
          ? {
              ...base,
              queueName: QUEUE_NAMES.DIFF_TAGS,
              data: {
                ...base.data,
                tags,
              },
            }
          : null,
        typeof extractedReportType === 'string' &&
        extractedReportType.trim().length > 0 &&
        registryReportId
          ? {
              ...base,
              queueName: QUEUE_NAMES.DIFF_REPORT_TYPE,
              data: {
                ...base.data,
                registryReportId,
                existingReportTypeId,
                reportTypeSlug: extractedReportType.trim(),
              },
            }
          : null,
      ].filter((e) => e !== null),
    })

    return { saved: true }
  }
)

export default checkDB
