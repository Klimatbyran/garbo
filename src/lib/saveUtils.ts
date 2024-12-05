import { getReportingPeriodDates } from './reportingPeriodDates'

export function formatAsReportingPeriods(
  entries: { year: number }[],
  fiscalYear: { startMonth: number; endMonth: number },
  category: 'emissions' | 'economy'
) {
  return entries.map(({ year, ...data }) => {
    const [startDate, endDate] = getReportingPeriodDates(
      year,
      fiscalYear.startMonth,
      fiscalYear.endMonth
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
const recursiveOmit = <T extends Object>(
  obj: T,
  keys: Set<string>,
  visitedIn?: Set<any>
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

export const askDiff = async (before: any, after: any) => {
  if (!before || !after) return 'NO_CHANGES'
  return await askPrompt(
    `What is changed between these two json values? Please respond in clear text with markdown formatting. 
The purpose is to let an editor approve the changes or suggest changes in Discord.
Be as brief as possible. Never be technical - meaning no comments about structure changes, fields renames etc.
Focus only on the actual values that have changed.
When handling years and ambiguous dates, always use the last year in the period (e.g. startDate: 2020 - endDate: 2021 should be referred to as 2021).
NEVER REPEAT UNCHANGED VALUES OR UNCHANGED YEARS! If nothing important has changed, just write "NO_CHANGES".`,
    JSON.stringify({
      before: recursiveOmit(structuredClone(before), new Set(['metadata'])),
      after: recursiveOmit(structuredClone(after), new Set(['metadata'])),
    })
  )
}
