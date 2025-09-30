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
async function pushWikidata() {
  const envBaseURL: string = 'https://api.klimatkollen.se/api'

  const companyRes = await fetch(`${envBaseURL}/companies`)

  if (!companyRes.ok) {
    console.error('Could not fetch companies')
    exit(0)
  }

  const companies: any[] = await companyRes.json()
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
            reportingPeriod.reportURL ?? '',
          ),
        )
      }
    }
    claims = reduceToMostRecentClaims(claims)
    if (claims.length > 0) {
      await bulkCreateOrEditCarbonFootprintClaim(
        company.wikidataId as `Q${number}`,
        claims,
      )
    }
  }
}

pushWikidata()
