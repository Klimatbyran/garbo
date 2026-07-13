import { EntityId, SearchResult } from 'wikibase-sdk'
import { ask } from '../lib/openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { PipelineJob, PipelineWorker } from '../lib/PipelineWorker'
import wikidata, { Wikidata } from '../prompts/wikidata'
import apiConfig from '../config/api'
import { ChatCompletionMessageParam } from 'openai/resources'
import { QUEUE_NAMES } from '../queues'
import { getWikidataEntities, searchCompany } from '@/lib/wikidata/read'
import { apiFetch } from '../lib/api'
import {
  companyMutationPath,
  pipelineCompanyReadPath,
} from '../lib/pipelineCompanyPath'
import { findCompanyByWikidataId } from '../lib/pipelineCompanyResolve'
import type { CompanyLinkCandidate } from '../lib/companyLinkResolve'
import { syncCanonicalReportRunCompanyId } from '../lib/pipelineRunCompanyId'
import { buildEarlyRegistryPayload } from './saveToAPI.utils'
import { registryService } from '../api/services/registryService'

export class GuessWikidataJob extends PipelineJob {
  declare data: PipelineJob['data'] & {
    companyName: string
    companyId: string
    overrideWikidataId: EntityId
    wikidata?: Wikidata
    sourceUrl?: string
    pdfCache?: { publicUrl?: string; sha256?: string }
    documentReportYear?: string | number
  }
}

const insignificantWords = new Set([
  'ab',
  'the',
  'and',
  'inc',
  'co',
  'publ',
  '(publ)',
  '(ab)',
  'aktiebolag',
  'aktiebolaget',
])

async function handleOverrideWikidataId(
  job: GuessWikidataJob,
  companyName: string,
  overrideWikidataId: EntityId
): Promise<string | null> {
  const wikidataEntities = await getWikidataEntities([
    overrideWikidataId as `Q${number}`,
  ])

  if (!wikidataEntities.length) {
    throw new Error(
      `No Wikidata entity found for overrideWikidataId ${overrideWikidataId}`
    )
  }

  const [{ id, labels, descriptions }] = wikidataEntities

  const label =
    labels?.sv?.value ??
    labels?.en?.value ??
    Object.values(labels ?? {})[0]?.value ??
    companyName

  const description =
    descriptions?.sv?.value ??
    descriptions?.en?.value ??
    Object.values(descriptions ?? {})[0]?.value ??
    ''

  const wikidataForApproval = {
    node: id,
    url: `https://wikidata.org/wiki/${id}`,
    label,
    description,
  } satisfies Wikidata

  job.log('Using overrideWikidataId, requesting approval for verification')

  const metadata = {
    source: 'override-wikidata-id',
    comment: 'Wikidata ID explicitly provided as override - please verify',
  }

  // Request approval (not auto-approved) so user can verify the override
  await job.requestApproval(
    'wikidata',
    {
      type: 'wikidata',
      newValue: { wikidata: wikidataForApproval },
    },
    false, // requires manual approval
    metadata,
    `Wikidata override for ${companyName} - please verify`
  )

  await job.sendMessage({
    content: `Override Wikidata ID provided. Please verify this is correct:
\`\`\`md
${JSON.stringify(wikidataForApproval, null, 2)}
\`\`\``,
  })

  await job.moveToDelayed(Date.now() + apiConfig.jobDelay)
  return null
}

async function loadCompanyLinkCandidate(
  companyId: string
): Promise<CompanyLinkCandidate> {
  const company = (await apiFetch(pipelineCompanyReadPath(companyId)).catch(
    () => null
  )) as { id?: string; name?: string; wikidataId?: string | null } | null

  return {
    id: companyId,
    name: company?.name ?? companyId,
    wikidataId: company?.wikidataId ?? null,
  }
}

/**
 * When Wikidata is already linked to a different company, ask staff to confirm
 * the company id before persisting. Returns false when waiting on approval.
 */
async function ensureCompanyLinkBeforeWikidataPersist(
  job: GuessWikidataJob,
  companyName: string,
  wikidata: Wikidata
): Promise<boolean> {
  if (job.data.approval?.type === 'companyLink' && !job.isDataApproved()) {
    job.log('Waiting for company link approval before Wikidata persist')
    await job.moveToDelayed(Date.now() + apiConfig.jobDelay)
    return false
  }

  const pipelineCompanyId = job.data.companyId
  if (!pipelineCompanyId) {
    throw new Error('Missing companyId on guessWikidata job')
  }

  const wikidataOwner = await findCompanyByWikidataId(wikidata.node)
  if (!wikidataOwner || wikidataOwner.id === pipelineCompanyId) {
    return true
  }

  job.log(
    `Wikidata ${wikidata.node} belongs to company ${wikidataOwner.id}; pipeline company is ${pipelineCompanyId} — requesting staff confirmation`
  )

  const pipelineCompany = await loadCompanyLinkCandidate(pipelineCompanyId)
  await job.updateData({ ...job.data, wikidata })

  const metadata = {
    source: 'wikidata-relink',
    comment: `Wikidata ${wikidata.node} is already linked to another company. Confirm which company this report belongs to before saving.`,
  }

  await job.requestApproval(
    'companyLink',
    {
      type: 'companyLink',
      newValue: {
        extractedName: companyName,
        candidates: [wikidataOwner, pipelineCompany],
        allowCreateNew: false,
        wikidataNode: wikidata.node,
      },
    },
    false,
    metadata,
    `Confirm company for ${wikidata.node} (${companyName})`
  )

  await job.sendMessage({
    content: `Wikidata ${wikidata.node} is already linked to "${wikidataOwner.name}". Please confirm which company this report belongs to in Validate.`,
  })

  await job.moveToDelayed(Date.now() + apiConfig.jobDelay)
  return false
}

function resolveCompanyIdFromCompanyLinkApproval(job: GuessWikidataJob): {
  companyId: string
  skipWikidataAssign: boolean
} {
  const approved = job.getApprovedBody()
  const pipelineCompanyId = job.data.companyId
  if (!pipelineCompanyId) {
    throw new Error('Missing companyId on guessWikidata job')
  }

  if (approved.createNew) {
    throw new Error(
      'Create-new is not allowed when resolving a Wikidata company link conflict'
    )
  }

  const selectedCompanyId =
    typeof approved.companyId === 'string' && approved.companyId.trim()
      ? approved.companyId.trim()
      : pipelineCompanyId

  return {
    companyId: selectedCompanyId,
    skipWikidataAssign: selectedCompanyId === pipelineCompanyId,
  }
}

async function persistApprovedWikidata(
  job: GuessWikidataJob,
  companyName: string,
  wikidata: Wikidata,
  options: {
    verified?: boolean
    metadata?: { source: string; comment: string }
    verifiedByUserId?: string
    companyId?: string
    skipWikidataAssign?: boolean
  }
) {
  const companyId = options.companyId ?? job.data.companyId
  if (!companyId) {
    throw new Error('Missing companyId on guessWikidata job')
  }

  if (companyId !== job.data.companyId) {
    job.log(`Using staff-confirmed company id=${companyId}`)
    await job.updateData({ ...job.data, companyId })
  }

  const body: Record<string, unknown> = {
    name: companyName,
    metadata: options.metadata,
    verified: options.verified ?? false,
    ...(options.verifiedByUserId && {
      verifiedByUserId: options.verifiedByUserId,
    }),
  }

  if (!options.skipWikidataAssign) {
    body.wikidataId = wikidata.node
  } else {
    job.log(
      `Keeping pipeline company ${companyId} without assigning Wikidata ${wikidata.node}`
    )
  }

  await apiFetch(companyMutationPath(companyId), { body })

  const threadId = job.data.threadId?.trim()
  if (threadId) {
    await syncCanonicalReportRunCompanyId({
      threadId,
      companyId,
      pdfUrl: job.data.url,
      companyName,
      wikidataId: options.skipWikidataAssign ? null : wikidata.node,
    })
  }

  await backfillRegistryWikidataFromJob(job, wikidata)
}

async function backfillRegistryWikidataFromJob(
  job: GuessWikidataJob,
  wikidata: Wikidata
) {
  const payload = buildEarlyRegistryPayload({
    companyName: job.data.companyName,
    wikidata: { node: wikidata.node },
    url: job.data.url,
    sourceUrl: job.data.sourceUrl,
    pdfCache: job.data.pdfCache,
    documentReportYear: job.data.documentReportYear,
  })
  if (!payload) return

  try {
    const report = await registryService.upsertReportInRegistry(payload)
    job.log(`Registry wikidata backfill: ${report.id} → ${wikidata.node}`)
  } catch (error: any) {
    job.log(
      `Registry wikidata backfill failed: ${error?.message ?? String(error)}`
    )
  }
}

const guessWikidata = new PipelineWorker<GuessWikidataJob>(
  QUEUE_NAMES.GUESS_WIKIDATA,
  async (job: GuessWikidataJob) => {
    const { companyName, companyId, overrideWikidataId } = job.data
    if (!companyName) throw new Error('No company name was provided')
    if (!companyId) throw new Error('No companyId was provided')
    job.log('Company name: ' + companyName)
    job.log('Approval: ' + JSON.stringify(job.data.approval, null, 2))

    const pendingWikidata = job.data.wikidata as Wikidata | undefined

    if (
      job.data.approval?.type === 'companyLink' &&
      job.isDataApproved() &&
      pendingWikidata?.node
    ) {
      const { companyId: confirmedCompanyId, skipWikidataAssign } =
        resolveCompanyIdFromCompanyLinkApproval(job)
      const metadata = job.data.approval?.metadata

      await persistApprovedWikidata(job, companyName, pendingWikidata, {
        verified: !job.data.autoApprove,
        metadata,
        verifiedByUserId: job.data.approval?.verifiedByUserId,
        companyId: confirmedCompanyId,
        skipWikidataAssign,
      })

      job.editMessage({
        content: skipWikidataAssign
          ? `Company link confirmed for ${companyName} (Wikidata not assigned to pipeline company)`
          : `Company link confirmed for ${companyName}`,
      })

      return JSON.stringify(
        {
          status: 'approved',
          wikidata: pendingWikidata,
          companyId: confirmedCompanyId,
          skipWikidataAssign,
          message: `Company link confirmed for ${companyName}`,
          metadata,
        },
        null,
        2
      )
    }

    if (
      job.data.approval?.type === 'companyLink' &&
      job.hasApproval() &&
      !job.isDataApproved()
    ) {
      await job.moveToDelayed(Date.now() + apiConfig.jobDelay)
      return
    }

    // If approved, process the wikidata (takes precedence - don't override approved data)
    if (job.data.approval?.type === 'wikidata' && job.isDataApproved()) {
      const approvedWikidata = job.getApprovedBody().wikidata as
        | Wikidata
        | undefined
      if (!approvedWikidata) {
        throw new Error('Missing approved wikidata: ' + approvedWikidata)
      }

      const metadata = job.data.approval?.metadata

      const ready = await ensureCompanyLinkBeforeWikidataPersist(
        job,
        companyName,
        approvedWikidata
      )
      if (!ready) return

      await persistApprovedWikidata(job, companyName, approvedWikidata, {
        // verified false when job autoApprove is on; human approver id comes from Validate rerun.
        verified: !job.data.autoApprove,
        metadata,
        verifiedByUserId: job.data.approval?.verifiedByUserId,
      })

      job.editMessage({
        content: `Thanks for approving the wikidata for: ${companyName}`,
      })

      return JSON.stringify(
        {
          status: 'approved',
          wikidata: approvedWikidata,
          message: `Wikidata approved for ${companyName}`,
          metadata,
        },
        null,
        2
      )
    }

    // If overrideWikidataId is provided (and not approved), fetch it and request approval
    // This allows the user to verify the override is correct
    if (overrideWikidataId) {
      const result = await handleOverrideWikidataId(
        job,
        companyName,
        overrideWikidataId
      )
      if (result) return result
    }

    // If approval exists but not approved, wait for approval
    if (job.hasApproval() && !job.isDataApproved()) {
      await job.moveToDelayed(Date.now() + apiConfig.jobDelay)
      return
    }

    /* NOTE: Can be activated once the corresponding endpoint is ready in prod

    const queryProductionRes = await fetch(apiConfig.prod_base_url + '/companies/search?q=' + companyName , {method: 'GET', headers: {'Content-Type': 'application/json'}});    
    const queryProductionData = await queryProductionRes.json();
    if(queryProductionData.length === 1) {
      const [{ id, labels, descriptions }] = await getWikidataEntities([
        queryProductionData[0].wikidataId,
      ])
      // NOTE: Maybe do a proper safe parse and check more languages than `sv` and `en`

      const wikidata = {
        node: id,
        url: `https://wikidata.org/wiki/${id}`,
        label: labels.sv?.value ?? labels.en.value,
        description: descriptions.sv?.value ?? descriptions.en.value,
      } satisfies Wikidata

      job.log("auto approve");

      // Auto-approve since company found in production by search
      await job.requestApproval(
        'wikidata',
        {
          type: 'wikidata',
          newValue: { wikidata }
        },
        true, // auto-approved
        {
          source: 'production-search',
          comment: 'Company found in production via search'
        },
        `Auto-approved wikidata for ${companyName} from production search`
      )

      job.sendMessage({
        content: `Company with the same name found in production auto-approving the wikidata for: ${companyName}`,
      })

      return JSON.stringify({ wikidata }, null, 2)
    }
    */

    async function getWikidataSearchResults({
      companyName,
      retry = 0,
    }: {
      companyName: string
      retry?: number
    }): Promise<SearchResult[]> {
      if (retry > 3) return []

      job.log(`Searching for company name: ${companyName} (attempt ${retry})`)
      const results = await searchCompany({ companyName })

      job.log('Wikidata search results: ' + JSON.stringify(results, null, 2))
      if (results.length) return results

      if (retry === 0) {
        const simplifiedCompanyName = companyName
          .split(/\s+/)
          .filter((word) => !insignificantWords.has(word.toLowerCase()))
          .join(' ')

        return getWikidataSearchResults({
          companyName: simplifiedCompanyName,
          retry: retry + 1,
        })
      }

      // Retry without unwanted keywords, e.g. Telia Group -> Telia
      const name = companyName.split(' ').slice(0, -1).join(' ')
      return name
        ? getWikidataSearchResults({
            companyName: name,
            retry: retry + 1,
          })
        : []
    }

    let wikidataForApproval: Wikidata | undefined

    if (!overrideWikidataId) {
      const searchResults = await getWikidataSearchResults({ companyName })
      const results = await getWikidataEntities(
        searchResults.map((result) => result.id) as `Q${number}`[]
      )

      job.log('Results: ' + JSON.stringify(results, null, 2))
      if (results.length === 0) {
        await job.sendMessage(
          `❌ Hittade inte Wikidata för: ${companyName}. Pipeline continues without Wikidata.`
        )
        job.log(`No Wikidata entry for "${companyName}" — non-blocking`)
        return JSON.stringify(
          { status: 'not_found', message: `No Wikidata for ${companyName}` },
          null,
          2
        )
      }

      const orderedResults = results
        .toSorted((a, b) => {
          // Move companies which include "carbon footprint" (P5991) to the start of the search results
          // IDEA: Maybe we could make a qualified guess here, for example by ordering search results which include certain keywords
          // Or do a string similarity search.
          const hasEmissions = (e: any) => Boolean(e?.claims?.P5991)
          return (hasEmissions(a) ? 0 : 1) - (hasEmissions(b) ? 0 : 1)
        })
        .map((e) => {
          // Exclude claims to reduce the number of input + output tokens since we are primarily interested in the wikidataId.
          // If we want to find other data like the company logo, we could filter the search results based on the wikidataId and extract the relevant property `PXXXXX` for the logo, which is probably standardised by wikidata
          return { ...e, claims: undefined }
        })

      const response = await ask(
        [
          {
            role: 'system',
            content: `I have a company named ${companyName} and I am looking for the wikidata entry related to this company. Be helpful and try to be accurate.`,
          },
          { role: 'user', content: wikidata.prompt },
          {
            role: 'assistant',
            content: 'OK. Just send me the wikidata search results?',
          },
          {
            role: 'user',
            content: JSON.stringify(orderedResults, null, 2),
          },
          Array.isArray(job.stacktrace)
            ? { role: 'user', content: job.stacktrace.join('\n') }
            : undefined,
        ].filter(
          (m) => m && m.content?.length > 0
        ) as ChatCompletionMessageParam[],
        { response_format: zodResponseFormat(wikidata.schema, 'wikidata') }
      )

      job.log('Response: ' + response)

      const { success, error, data } = wikidata.schema.safeParse(
        JSON.parse(response)
      )

      if (error || !success) {
        throw new Error('Failed to parse ' + error.message)
      }

      wikidataForApproval = data.wikidata
    }

    if (!wikidataForApproval?.node) {
      throw new Error(
        `Could not parse wikidataId from json: ${wikidataForApproval}`
      )
    }

    try {
      const checkIfWikidataExistInProductionRes = await fetch(
        apiConfig.prodBaseURL + '/companies/' + wikidataForApproval.node,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      )
      if (checkIfWikidataExistInProductionRes.ok) {
        const checkIfWikidataExistInProduction =
          await checkIfWikidataExistInProductionRes.json()
        if (checkIfWikidataExistInProduction.wikidataId) {
          // Auto-approve since company exists in production
          const metadata = {
            source: 'production-database',
            comment: 'Company found in production database',
          }

          await job.requestApproval(
            'wikidata',
            {
              type: 'wikidata',
              newValue: { wikidata: wikidataForApproval },
            },
            true,
            metadata,
            `Auto-approved wikidata for ${companyName}`
          )

          const ready = await ensureCompanyLinkBeforeWikidataPersist(
            job,
            companyName,
            wikidataForApproval
          )
          if (!ready) return

          await persistApprovedWikidata(job, companyName, wikidataForApproval, {
            verified: false,
            metadata,
          })

          job.sendMessage({
            content: `🚀 Company found in production database, we will approve automatically: ${companyName}`,
          })
          return JSON.stringify(
            {
              status: 'approved',
              wikidata: wikidataForApproval,
              message: `Auto-approved wikidata for ${companyName} (found in production database)`,
              metadata,
            },
            null,
            2
          )
        }
      }
    } catch (_error) {
      job.sendMessage({
        content: `😫 Could not find the company in the production database, we will have to ask the human.`,
      })
    }

    job.log('Creating approval request for wikidata')

    const metadata = {
      source: 'wikidata-search',
      comment: 'Wikidata found via search and LLM selection',
    }

    if (job.data.autoApprove) {
      await job.requestApproval(
        'wikidata',
        {
          type: 'wikidata',
          newValue: { wikidata: wikidataForApproval },
        },
        true,
        metadata,
        `Auto-approved wikidata for ${companyName}`
      )

      const ready = await ensureCompanyLinkBeforeWikidataPersist(
        job,
        companyName,
        wikidataForApproval
      )
      if (!ready) return

      await persistApprovedWikidata(job, companyName, wikidataForApproval, {
        verified: false,
        metadata,
      })

      await job.sendMessage({
        content: `Auto-approved wikidata for ${companyName} (job autoApprove enabled)`,
      })

      return JSON.stringify(
        {
          status: 'approved',
          wikidata: wikidataForApproval,
          message: `Auto-approved wikidata for ${companyName}`,
          metadata,
        },
        null,
        2
      )
    }

    // Create approval request using standard pattern
    await job.requestApproval(
      'wikidata',
      {
        type: 'wikidata',
        newValue: { wikidata: wikidataForApproval },
      },
      false, // requires manual approval
      metadata,
      `Wikidata selection for ${companyName}`
    )

    await job.sendMessage({
      content: `Is this the correct company?:
\`\`\`md
${JSON.stringify(wikidataForApproval, null, 2)}
\`\`\``,
    })

    await job.moveToDelayed(Date.now() + apiConfig.jobDelay)
  }
)

export default guessWikidata
