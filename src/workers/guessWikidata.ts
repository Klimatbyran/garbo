import { EntityId, SearchResult } from 'wikibase-sdk'
import { ask } from '../lib/openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import wikidata, { Wikidata } from '../prompts/wikidata'
import discord from '../discord'
import apiConfig from '../config/api'
import { ChatCompletionMessageParam } from 'openai/resources'
import { QUEUE_NAMES } from '../queues'
import { getWikidataEntities, searchCompany } from '@/lib/wikidata/read'

export class GuessWikidataJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    overrideWikidataId: EntityId
    wikidata?: Wikidata
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

  const buttonRow = discord.createEditWikidataButtonRow(job)

  await job.sendMessage({
    content: `Override Wikidata ID provided. Please verify this is correct:
\`\`\`md
${JSON.stringify(wikidataForApproval, null, 2)}
\`\`\``,
    components: [buttonRow],
  })

  await job.moveToDelayed(Date.now() + apiConfig.jobDelay)
  return null
}

const guessWikidata = new DiscordWorker<GuessWikidataJob>(
  QUEUE_NAMES.GUESS_WIKIDATA,
  async (job: GuessWikidataJob) => {
    const { companyName, overrideWikidataId } = job.data
    if (!companyName) throw new Error('No company name was provided')
    job.log('Company name: ' + companyName)
    job.log('Approval: ' + JSON.stringify(job.data.approval, null, 2))

    // If approved, process the wikidata (takes precedence - don't override approved data)
    if (job.isDataApproved()) {
      const approvedWikidata = job.getApprovedBody().wikidata
      if (!approvedWikidata) {
        throw new Error('Missing approved wikidata: ' + approvedWikidata)
      }

      const metadata = job.data.approval?.metadata

      job.editMessage({
        content: `Thanks for approving the wikidata for: ${companyName}`,
        components: [],
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
        components: [],
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
        await job.sendMessage(`❌ Hittade inte Wikidata för: ${companyName}.`)
        // TODO: If no wikidata entry was found, provide a link to create a new wikidata entry.
        // TODO: allow providing the wikidata entry if it is known, to continue the job.
        throw new Error(`No Wikidata entry for "${companyName}"`)
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
            true, // auto-approved
            metadata,
            `Auto-approved wikidata for ${companyName}`
          )

          job.sendMessage({
            content: `🚀 Company found in production database, we will approve automatically: ${companyName}`,
            components: [],
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
        content: `😫 Could not find the company in the production database, we will have to as the human.`,
        components: [],
      })
    }

    job.log('Creating approval request for wikidata')

    const metadata = {
      source: 'wikidata-search',
      comment: 'Wikidata found via search and LLM selection',
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

    const buttonRow = discord.createEditWikidataButtonRow(job)

    await job.sendMessage({
      content: `Is this the correct company?:
\`\`\`md
${JSON.stringify(wikidataForApproval, null, 2)}
\`\`\``,
      components: [buttonRow],
    })

    await job.moveToDelayed(Date.now() + apiConfig.jobDelay)
  }
)

export default guessWikidata
