import { prisma } from '../../lib/prisma'
import type { GlobalSearchResponse } from '../types'
import { municipalityService } from './municipalityService'
import { nationService } from './nationService'
import { regionalService } from './regionalService'

const MAX_CANDIDATES_PER_TYPE = 100
const MAX_RESULTS_TOTAL = 30

function normalizeSearchValue(value: string): string {
  return value.trim().toLocaleLowerCase('sv-SE')
}

function compareByRelevance(
  a: { name: string; type: 'company' | 'municipality' | 'region' | 'nation' },
  b: { name: string; type: 'company' | 'municipality' | 'region' | 'nation' },
  normalizedQuery: string
) {
  const aName = normalizeSearchValue(a.name)
  const bName = normalizeSearchValue(b.name)

  const aStartsWith = aName.startsWith(normalizedQuery)
  const bStartsWith = bName.startsWith(normalizedQuery)

  if (aStartsWith !== bStartsWith) {
    return aStartsWith ? -1 : 1
  }

  const aIndex = aName.indexOf(normalizedQuery)
  const bIndex = bName.indexOf(normalizedQuery)

  if (aIndex !== bIndex) {
    return aIndex - bIndex
  }

  const byName = a.name.localeCompare(b.name, 'sv-SE')

  if (byName !== 0) {
    return byName
  }

  return a.type.localeCompare(b.type, 'sv-SE')
}

class GlobalSearchService {
  async getGlobalSearchResults(
    name: string,
    currentLanguage: 'sv' | 'en'
  ): Promise<GlobalSearchResponse> {
    const normalizedQuery = normalizeSearchValue(name)

    if (!normalizedQuery) {
      return []
    }

    const companies = await prisma.company.findMany({
      where: {
        name: {
          contains: normalizedQuery,
          mode: 'insensitive',
        },
      },
      select: {
        name: true,
        wikidataId: true,
      },
      orderBy: {
        name: 'asc',
      },
      take: MAX_CANDIDATES_PER_TYPE,
    })

    const municipalities = municipalityService
      .getMunicipalities()
      .filter((municipality) =>
        municipality.name.toLocaleLowerCase('sv-SE').includes(normalizedQuery)
      )
      .slice(0, MAX_CANDIDATES_PER_TYPE)

    const regions = regionalService
      .getRegions()
      .filter((region) =>
        region.region.toLocaleLowerCase('sv-SE').includes(normalizedQuery)
      )
      .slice(0, MAX_CANDIDATES_PER_TYPE)

    const nations = nationService
      .getNations()
      .filter((nation) => {
        const countryNames = [nation.country?.sv, nation.country?.en]
          .filter(Boolean)
          .map((name) => name.toLocaleLowerCase('sv-SE'))
        return countryNames.some((name) => name.includes(normalizedQuery))
      })
      .slice(0, MAX_CANDIDATES_PER_TYPE)

    return [
      ...companies.map((company) => ({
        name: company.name,
        wikidataId: company.wikidataId,
        type: 'company' as const,
      })),
      ...municipalities.map((municipality) => ({
        name: municipality.name,
        type: 'municipality' as const,
      })),
      ...regions.map((region) => ({
        name: region.region,
        type: 'region' as const,
      })),
      ...nations.map((nation) => ({
        name: nation.country?.[currentLanguage],
        type: 'nation' as const,
      })),
    ]
      .sort((a, b) => compareByRelevance(a, b, normalizedQuery))
      .slice(0, MAX_RESULTS_TOTAL)
  }
}

export const globalSearchService = new GlobalSearchService()
