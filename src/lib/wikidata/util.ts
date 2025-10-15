import WBK, { ItemId } from 'wikibase-sdk'
import wikidataConfig from '../../config/wikidata'
import { Emissions } from '../emissions'

export interface Claim {
  id?: string
  startDate: string
  endDate: string
  value: string
  referenceUrl?: string
  archiveUrl?: string
  scope?: ItemId
  category?: ItemId
}

export interface RemoveClaim {
  id: string
  remove: boolean
}

const {
  SCOPE_1,
  SCOPE_2,
  SCOPE_2_LOCATION_BASED,
  SCOPE_2_MARKET_BASED,
  SCOPE_3,
} = wikidataConfig.entities

export const wbk = WBK({
  instance: 'https://www.wikidata.org',
  sparqlEndpoint: 'https://query.wikidata.org/sparql',
})

export const wikibaseEditConfig = {
  instance: wikidataConfig.wikidataURL,
  credentials: {
    oauth: {
      consumer_key: wikidataConfig.wikidataConsumerKey,
      consumer_secret: wikidataConfig.wikidataConsumerSecret,
      token: wikidataConfig.wikidataToken,
      token_secret: wikidataConfig.wikidataTokenSecret,
    },
  },
  userAgent: 'KlimatkollenGarbotBot/v0.1.0 (https://klimatkollen.se)',
}

/**
 * Compares if two claims have the same scope and optionally category
 * @param newClaim
 * @param exisitingClaim
 * @returns true if scope and category are equal
 */
export function compareClaims(claimA: Claim, claimB: Claim) {
  const scopeMatches = claimA.scope === claimB.scope
  const normalizeCategory = (category: ItemId | undefined) =>
    category || undefined
  const categoryMatches =
    normalizeCategory(claimA.category) === normalizeCategory(claimB.category)

  return scopeMatches && categoryMatches
}

/**
 * Compares two date strings
 * @param date1
 * @param date2
 * @returns difference in milliseconds
 */
export function compareDateStrings(date1?: string, date2?: string) {
  const epoch = '1970-01-01T00:00:00Z'
  return new Date(date1 || epoch).getTime() - new Date(date2 || epoch).getTime()
}

export function transformFromWikidataDateStringToDate(date: string) {
  return date.substring(1)
}

export function transformEmissionsToClaims(
  emissions: Emissions,
  startDate: string,
  endDate: string,
  referenceUrl?: string,
  archiveUrl?: string,
): Claim[] {
  const claims: Claim[] = []

  if (emissions.scope1?.total) {
    claims.push({
      startDate,
      endDate,
      referenceUrl,
      archiveUrl,
      scope: SCOPE_1,
      value: emissions.scope1.total.toString(),
    })
  }
  if (emissions.scope2?.mb) {
    claims.push({
      scope: SCOPE_2_MARKET_BASED,
      startDate,
      endDate,
      referenceUrl,
      archiveUrl,
      value: emissions.scope2.mb.toString(),
    })
  }
  if (emissions.scope2?.lb) {
    claims.push({
      scope: SCOPE_2_LOCATION_BASED,
      startDate,
      endDate,
      referenceUrl,
      archiveUrl,
      value: emissions.scope2.lb.toString(),
    })
  }
  if (emissions.scope2?.unknown) {
    claims.push({
      scope: SCOPE_2,
      startDate,
      endDate,
      referenceUrl,
      archiveUrl,
      value: emissions.scope2.unknown.toString(),
    })
  }
  emissions.scope3?.categories?.forEach((category) => {
    if (category.total !== null && category.total !== undefined) {
      claims.push({
        scope: SCOPE_3,
        startDate,
        endDate,
        referenceUrl,
        archiveUrl,
        category: wikidataConfig.translateIdToCategory(category.category),
        value: category.total.toString(),
      })
    }
  })

  // Add total scope 3 claim: prefer statedTotalEmissions, fallback to calculated sum of categories
  if (
    emissions.scope3?.statedTotalEmissions?.total !== null &&
    emissions.scope3?.statedTotalEmissions?.total !== undefined
  ) {
    claims.push({
      scope: SCOPE_3,
      startDate,
      endDate,
      referenceUrl,
      archiveUrl,
      value: emissions.scope3.statedTotalEmissions.total.toString(),
    })
  } else if (
    emissions.scope3?.categories &&
    emissions.scope3.categories.length > 0
  ) {
    // Calculate total from categories as fallback
    const calculatedTotal = emissions.scope3.categories.reduce(
      (total, category) => total + (category.total ?? 0),
      0,
    )
    if (calculatedTotal > 0) {
      claims.push({
        scope: SCOPE_3,
        startDate,
        endDate,
        referenceUrl,
        archiveUrl,
        value: calculatedTotal.toString(),
      })
    }
  }
  return claims
}
