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

// Test company ID mapping for sandbox testing
const TEST_COMPANY_MAPPING: Record<string, string> = {
  // Map production company IDs to test company IDs for sandbox testing
  // Format: "production_id": "test_id"
  "Q52825": "Q238311", // ABB production ID -> ABB test ID
}

//Currently still in testing the filters filter out only data related to ABB as this company is present in the Sandbox
async function pushWikidata(dryRun: boolean = false, companyQid?: string, useTestMapping: boolean = false) {
  const envBaseURL: string = 'https://api.klimatkollen.se/api'

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made to Wikidata\n')
  }

  if (companyQid) {
    console.log(`🎯 Filtering for company: ${companyQid}\n`)
  }

  if (useTestMapping) {
    console.log(`🧪 TEST MAPPING MODE - Using test company ID mapping\n`)
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
    console.log(`\n📊 Processing company: ${company.name} (${company.wikidataId})`)
    const reportingPeriods: ReportingPeriod[] = company.reportingPeriods
    console.log(`📅 Found ${reportingPeriods.length} reporting periods`)
    
    let claims: Claim[] = []
    for (const reportingPeriod of reportingPeriods) {
      if (reportingPeriod.emissions && reportingPeriod.reportURL) {
        console.log(`✅ Processing period: ${reportingPeriod.startDate} to ${reportingPeriod.endDate}`)
        claims.push(
          ...transformEmissionsToClaims(
            reportingPeriod.emissions,
            removeMillisecondsFromISO(reportingPeriod.startDate),
            removeMillisecondsFromISO(reportingPeriod.endDate),
            reportingPeriod.reportURL ?? '',
          ),
        )
      } else {
        console.log(`⚠️  Skipping period: ${reportingPeriod.startDate} to ${reportingPeriod.endDate} (missing emissions or reportURL)`)
      }
    }
    
    console.log(`📝 Generated ${claims.length} claims before filtering`)
    claims = reduceToMostRecentClaims(claims)
    console.log(`📝 Generated ${claims.length} claims after filtering to most recent`)
    
    if (claims.length > 0) {
      // Use test mapping if enabled and mapping exists
      let targetWikidataId = company.wikidataId as `Q${number}`
      if (useTestMapping && TEST_COMPANY_MAPPING[company.wikidataId]) {
        targetWikidataId = TEST_COMPANY_MAPPING[company.wikidataId] as `Q${number}`
        console.log(`🔄 Mapping ${company.wikidataId} -> ${targetWikidataId} for test environment`)
      }
      
      console.log(`🚀 Pushing ${claims.length} claims to Wikidata entity ${targetWikidataId}`)
      await bulkCreateOrEditCarbonFootprintClaim(
        targetWikidataId,
        claims,
        dryRun,
      )
    } else {
      console.log(`❌ No claims to push for ${company.name}`)
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const dryRun = args.includes('dry-run')
const useTestMapping = args.includes('--test')

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

pushWikidata(dryRun, companyQid, useTestMapping)
