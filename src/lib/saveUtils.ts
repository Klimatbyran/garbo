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

export const askDiff = async (before: any, after: any) => {
  if (!before || !after) return 'NO_CHANGES'
  return await askPrompt(
    `What is changed between these two json values? Please respond in clear text with markdown formatting. 
The purpose is to let an editor approve the changes or suggest changes in Discord.
Be as brief as possible. Never be technical - meaning no comments about structure changes, fields renames etc.
Focus only on the actual values that have changed.
When handling years and ambiguous dates, always use the last year in the period (e.g. startDate: 2020 - endDate: 2021 should be referred to as 2021).
NEVER REPEAT UNCHANGED VALUES OR UNCHANGED YEARS! If nothing important has changed, just write "NO_CHANGES".`,
    JSON.stringify({ before, after })
  )
}
