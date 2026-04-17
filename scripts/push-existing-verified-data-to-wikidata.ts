import { Claim, transformEmissionsToClaims } from '../src/lib/wikidata/util'
import {
  bulkCreateOrEditCarbonFootprintClaim,
  reduceToMostRecentClaims,
} from '../src/lib/wikidata/edit'
import { exit } from 'process'
import { ReportingPeriod } from '../src/lib/emissions'

function removeMillisecondsFromISO(dateTime: string) {
  try {
    // Check if input is a valid ISO string
    const date = new Date(dateTime)
    if (isNaN(date.getTime())) {
      throw new Error('Invalid ISO DateTime string')
    }

    // Convert to ISO string and remove the milliseconds part
    return date.toISOString().split('.')[0] + 'Z'
  } catch (error: unknown) {
    console.error('Error:', error instanceof Error && error.message)
    return ''
  }
}

//Currently still in testing the filters filter out only data related to ABB as this company is present in the Sandbox
async function pushWikidata(dryRun: boolean = false, companyQid?: string) {
  const envBaseURL: string = 'https://api.klimatkollen.se/api'

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made to Wikidata\n')
  }

  if (companyQid) {
    console.log(`🎯 Filtering for company: ${companyQid}\n`)
  }

  const companyRes = await fetch(`${envBaseURL}/companies`)

  if (!companyRes.ok) {
    console.error('Could not fetch companies')
    exit(0)
  }

  let companies: any[] = await companyRes.json()

  // Filter for specific company if QID is provided
  if (companyQid) {
    companies = companies.filter((c) => c.wikidataId === companyQid)
    if (companies.length === 0) {
      console.log(`❌ Company ${companyQid} not found in companies data`)
      exit(0)
    }
    console.log(`✅ Found company: ${companies[0].name} (${companyQid})\n`)
  }

  for (const company of companies) {
    const reportingPeriods: ReportingPeriod[] = company.reportingPeriods
    let claims: Claim[] = []
    for (const reportingPeriod of reportingPeriods) {
      if (reportingPeriod.emissions && reportingPeriod.reportURL) {
        claims.push(
          ...transformEmissionsToClaims(
            reportingPeriod.emissions,
            removeMillisecondsFromISO(reportingPeriod.startDate),
            removeMillisecondsFromISO(reportingPeriod.endDate),
            reportingPeriod.reportURL ?? ''
          )
        )
      }
    }
    claims = reduceToMostRecentClaims(claims)
    if (claims.length > 0) {
      await bulkCreateOrEditCarbonFootprintClaim(
        company.wikidataId as `Q${number}`,
        claims,
        dryRun
      )
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const dryRun = args.includes('dry-run')

// Parse company QID flag (e.g., --company=Q52618 or --company Q52618)
let companyQid: string | undefined
const companyArgIndex = args.findIndex((arg) => arg.startsWith('--company'))
if (companyArgIndex !== -1) {
  const companyArg = args[companyArgIndex]
  if (companyArg.includes('=')) {
    // Format: --company=Q52618
    companyQid = companyArg.split('=')[1]
  } else if (companyArgIndex + 1 < args.length) {
    // Format: --company Q52618
    companyQid = args[companyArgIndex + 1]
  }
}

pushWikidata(dryRun, companyQid)
