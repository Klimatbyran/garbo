import apiConfig from '../config/api'
import { getReportingPeriodDates } from './reportingPeriodDates'

export function formatAsReportingPeriods(
  entries: { year: number }[],
  fiscalYear: { startMonth: number; endMonth: number },
  category: 'emissions' | 'economy',
) {
  return entries.map(({ year, ...data }) => {
    const [startDate, endDate] = getReportingPeriodDates(
      year,
      fiscalYear.startMonth,
      fiscalYear.endMonth,
    )
    return {
      startDate,
      endDate,
      [category]:
        category === 'economy'
          ? (data as { economy: any }).economy
          : {
              ...data,
            },
    }
  })
}

import { askPrompt } from './openai'

export const defaultMetadata = (url: string) => ({
  source: url,
  comment: 'Parsed by Garbo AI',
})

/**
 * Recusrively remove the provided keys from all levels of the object.
 *
 * Handles circular references.
 * Source: https://stackoverflow.com/a/72493889
 */
const recursiveOmit = <T extends object>(
  obj: T,
  keys: Set<string>,
  visitedIn?: Set<object>,
): T => {
  if (obj == null || typeof obj !== 'object') return obj
  const visited = visitedIn ?? new Set()
  visited.add(obj)
  Object.entries(obj).forEach(([key, val]) => {
    if (keys.has(key)) {
      delete obj[key as keyof T]
    } else if (typeof val === 'object' && !visited.has(val)) {
      recursiveOmit(val, keys, visited)
    }
  })
  return obj
}

const askDiff = async (before: object, after: object) => {
  if (!after) return 'NO_CHANGES'

  return await askPrompt(
    `What is changed between these two json values? If the before value is missing that means the company did not exist previously and everything is a change (No need to mention that just start with something like: "Here is fresh data for you to approve:" and describe the new additions..

    Please respond clearly and concisely in text with markdown formatting:
    - Use simple, reader-friendly language to explain the changes.
    - When a report or data is added for a specific year, mention it as: "Added a report for [year]."
    - Do not mention technical details like structure changes or metadata.
    - Avoid repeating unchanged values or years.
    - If nothing important has changed, simply write: "NO_CHANGES."
    
    When handling years or date ranges, always refer to the last year in the range (e.g., startDate: 2020 - endDate: 2021 should be referred to as 2021).
    
    Summarize the changes and avoid unnecessary repetition.`,

    JSON.stringify({
      before: recursiveOmit(structuredClone(before), new Set(['metadata'])),
      after: recursiveOmit(structuredClone(after), new Set(['metadata'])),
    }),
  )
}

export async function diffChanges<T extends object>({
  existingCompany,
  before,
  after,
}: {
  existingCompany: any
  before: T
  after: T
}) {
  const diff = await askDiff(before, after)
  const hasChanges = diff && !diff.includes('NO_CHANGES')
  const requiresApproval = Boolean(existingCompany) || hasChanges
  return { diff: hasChanges ? diff : '', requiresApproval }
}

export function getCompanyURL(name: string, wikidataId: string) {
  return `${apiConfig.frontendURL}/companies/${wikidataId}`
}
