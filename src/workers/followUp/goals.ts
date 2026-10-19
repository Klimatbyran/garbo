import { QUEUE_NAMES } from '../../queues'
import { FollowUpJob, FollowUpWorker } from '../../lib/FollowUpWorker'
import { z } from 'zod'
import { FollowUpType } from '../../types'
import {
  goalBaseYearSourceSchema,
  goalHorizonSchema,
  goalTargetDirectionSchema,
  goalTargetTypeSchema,
} from '../../api/schemas/common'
import { resolveDocumentReportYear } from '../saveToAPI.utils'

const NEAR_TERM_MAX_YEARS_FROM_BASE_YEAR = 10

class FollowUpGoalsJob extends FollowUpJob {
  declare data: FollowUpJob['data'] & {
    sourceUrl?: string
    documentReportYear?: string | number
  }
}

// TODO: In the future, import the schemas from a shared place
export const schema = z.object({
  goals: z.array(
    z.object({
      description: z.string(),
      originalQuote: z.string().nullable(),
      targetType: goalTargetTypeSchema,
      targetDirection: goalTargetDirectionSchema.nullable(),
      target: z.number().nullable(),
      unit: z.string().nullable(),
      intensityMetric: z.string().nullable(),
      isSbtiTarget: z.boolean(),
      year: z.string().nullable(),
      baseYear: z.string().nullable(),
      baseYearSource: goalBaseYearSourceSchema,
    })
  ),
})

type ExtractedGoal = z.infer<typeof schema>['goals'][number]
type GoalHorizon = z.infer<typeof goalHorizonSchema>
type GoalBaseYearSource = z.infer<typeof goalBaseYearSourceSchema>

function describeReportYear(reportYear: string | undefined) {
  return reportYear
    ? `The report year is ${reportYear}.`
    : 'The report year is unknown.'
}

export function buildPrompt(reportYear: string | undefined) {
  return `
A goal is a measurable commitment: a quantity or end-state plus a time
horizon, e.g. "reduce scope 1 and 2 emissions by 60% by 2030" or
"net zero by 2040". Actions, programmes and investments are NOT goals.

${describeReportYear(reportYear)}

Rules:
- Only include goals the report presents as current. Ignore goals described
  as achieved, past, superseded or "previously". If the same goal appears
  with different numbers, use the version for the report year.
- List each distinct goal once. If the same goal is worded in several ways,
  merge them into one entry and keep the most specific wording.
- Include all company-wide climate goals.
- Write every description in Swedish, whatever language the report uses.
  originalQuote stays in the report's language.

Fields:
- originalQuote: the sentence or sentences in the report that state the
  goal, copied character for character from the text above. Do not
  translate, shorten, reword or fix typos. If merged goals are stated in
  several places, quote the most specific one. null only if no single
  passage states the goal.
- description: your own summary, one plain Swedish sentence stating the
  goal's content only, with no parenthetical tags.
- targetType: one of
  "ABSOLUTE": reduce total emissions,
  "INTENSITY": reduce emissions per unit of activity, e.g. per product,
    per vehicle-km or per revenue,
  "NET_ZERO": reach net zero emissions,
  "CLIMATE_NEUTRAL": reach climate or carbon neutrality,
  "OTHER": any other climate goal, e.g. "100 % förnybar el".
- targetDirection: one of
  "REDUCE_BY": target is the amount reduced BY, relative to baseYear.
  "REACH_LEVEL": target is the level the report says to reach.
  null if target is null.
- target: a number.
  For ABSOLUTE and INTENSITY goals:
    - If the report states the amount to reduce BY, use that number and
      targetDirection "REDUCE_BY".
    - If the report states a relative level to reduce TO as a percentage
      of a known baseline, e.g. "to 40% of 2019 levels", convert it to a
      reduction amount: target 60, unit "%", targetDirection "REDUCE_BY".
    - If the report states an absolute end-level with no computable
      reduction amount, e.g. "at most 50,000 tonnes CO2e by 2030", use
      that level: target 50000, unit "tCO2e", targetDirection
      "REACH_LEVEL". Do not set target to null just because no reduction
      percentage is stated.
  For OTHER goals: the stated value, e.g. 100, targetDirection
    "REACH_LEVEL".
  For NET_ZERO and CLIMATE_NEUTRAL goals: if the report also states a
    reduction, e.g. "net zero by 2040, reducing emissions by 90%", use
    it with targetDirection "REDUCE_BY". Otherwise null.
- unit: the unit of target. Use exactly "%" for percentages and exactly
  "tCO2e" for tonnes CO2 equivalent (convert kt and Mt into tonnes by
  scaling target). For any other unit, copy it as written. Never invent
  a unit. null if target is null.
- intensityMetric: for INTENSITY goals only, what emissions are measured
  per, in Swedish, e.g. "per fordonskilometer", "per ton producerat
  stål". null for all other goal types.
- isSbtiTarget: true only if the report says the goal is an SBTi target
  or validated by the Science Based Targets initiative. Otherwise false.
- year: the year by which the goal is to be reached. This is NOT the year
  it was reported or achieved. null if no year is stated.
- baseYear and baseYearSource: the year THIS goal is measured from, and
  how you found it. Never use the target year as baseYear, and never copy
  another goal's base year unless the report says they share it.
  baseYearSource is one of:
  "STATED_FOR_GOAL": the report states the start year for this goal,
    e.g. "compared with 2019", "reduce emissions from 2011 to 2030"
    (baseYear "2011"). Search the goal's own sentence, the surrounding
    paragraphs, tables and footnotes about the same goal.
  "COMPANY_BASE_YEAR": the goal is measured "against our base year" or
    similar without naming a year, and the company's base year is stated
    elsewhere in the report. Use that year.
  "REPORT_YEAR": the goal says or clearly implies it counts from now,
    e.g. "from today", "starting this year", "over the next ten years".
    Set baseYear to null; the report year is filled in automatically.
  "NOT_STATED": none of the above. Set baseYear to null.
  For SBTi targets, only "STATED_FOR_GOAL" or "NOT_STATED" are allowed.
  SBTi targets have an official base year: use it only if the report
  states it for this target, never infer it from anything else.

Use null for anything not stated. Never guess.

Example: Ensure the output is in JSON format and do not use markdown.
\`\`\`json
{
  "goals": [
    {
      "originalQuote": "We have committed to reach net-zero greenhouse gas emissions by 2040, validated by the SBTi.",
      "description": "Nå nettonollutsläpp till 2040",
      "targetType": "NET_ZERO",
      "targetDirection": null,
      "target": null,
      "unit": null,
      "intensityMetric": null,
      "isSbtiTarget": true,
      "year": "2040",
      "baseYear": null,
      "baseYearSource": "NOT_STATED"
    },
    {
      "originalQuote": "By 2030, absolute scope 1 and 2 emissions will be cut to 40% of 2019 levels.",
      "description": "Minska absoluta utsläpp inom scope 1 och 2 med 60 % till 2030",
      "targetType": "ABSOLUTE",
      "targetDirection": "REDUCE_BY",
      "target": 60,
      "unit": "%",
      "intensityMetric": null,
      "isSbtiTarget": false,
      "year": "2030",
      "baseYear": "2019",
      "baseYearSource": "STATED_FOR_GOAL"
    },
    {
      "originalQuote": "Our goal is to reduce emissions from transport by 70% between 2011 and 2030.",
      "description": "Minska utsläppen från transporter med 70 % mellan 2011 och 2030",
      "targetType": "ABSOLUTE",
      "targetDirection": "REDUCE_BY",
      "target": 70,
      "unit": "%",
      "intensityMetric": null,
      "isSbtiTarget": false,
      "year": "2030",
      "baseYear": "2011",
      "baseYearSource": "STATED_FOR_GOAL"
    },
    {
      "originalQuote": "Vi ska minska utsläppen med 52 % per fordonskilometer till 2030 jämfört med basåret.",
      "description": "Minska utsläppen per fordonskilometer med 52 % till 2030",
      "targetType": "INTENSITY",
      "targetDirection": "REDUCE_BY",
      "target": 52,
      "unit": "%",
      "intensityMetric": "per fordonskilometer",
      "isSbtiTarget": false,
      "year": "2030",
      "baseYear": "2018",
      "baseYearSource": "COMPANY_BASE_YEAR"
    },
    {
      "originalQuote": "Från och med i år ska vi minska våra utsläpp till högst 50 000 ton CO2e senast 2030.",
      "description": "Minska utsläppen till högst 50 000 ton CO2e till 2030",
      "targetType": "ABSOLUTE",
      "targetDirection": "REACH_LEVEL",
      "target": 50000,
      "unit": "tCO2e",
      "intensityMetric": null,
      "isSbtiTarget": false,
      "year": "2030",
      "baseYear": null,
      "baseYearSource": "REPORT_YEAR"
    }
  ]
}
\`\`\`
`
}

function resolveReportYear(jobData: FollowUpGoalsJob['data']) {
  return resolveDocumentReportYear([], {
    documentReportYear: jobData.documentReportYear,
    reportUrl: jobData.url,
    sourceUrl: jobData.sourceUrl,
  })
}

function parseYear(year: string | null) {
  const parsed = parseInt(year ?? '', 10)
  return Number.isNaN(parsed) ? null : parsed
}

function baseYearNotStated() {
  return { baseYear: null, baseYearSource: 'NOT_STATED' as GoalBaseYearSource }
}

export function resolveBaseYear(
  goal: Pick<ExtractedGoal, 'isSbtiTarget' | 'baseYear' | 'baseYearSource'>,
  reportYear: string | undefined
) {
  const isStated = goal.baseYearSource === 'STATED_FOR_GOAL'
  if (goal.isSbtiTarget && !isStated) return baseYearNotStated()
  if (goal.baseYearSource === 'REPORT_YEAR') {
    // Report year itself unknown -- "REPORT_YEAR" with no actual year to
    // show for it is a more confusing result than just admitting we don't
    // have a base year at all.
    if (!reportYear) return baseYearNotStated()
    return { baseYear: reportYear, baseYearSource: goal.baseYearSource }
  }
  if (goal.baseYearSource === 'NOT_STATED' || !goal.baseYear) {
    return baseYearNotStated()
  }
  return { baseYear: goal.baseYear, baseYearSource: goal.baseYearSource }
}

export function classifyHorizon(
  goal: Pick<ExtractedGoal, 'targetType' | 'year' | 'baseYear'>
): GoalHorizon | null {
  if (goal.targetType === 'NET_ZERO' || goal.targetType === 'CLIMATE_NEUTRAL') {
    return 'LONG_TERM'
  }
  const targetYear = parseYear(goal.year)
  const startYear = parseYear(goal.baseYear)
  if (targetYear === null || startYear === null) return null
  const yearsToTarget = targetYear - startYear
  return yearsToTarget <= NEAR_TERM_MAX_YEARS_FROM_BASE_YEAR
    ? 'NEAR_TERM'
    : 'LONG_TERM'
}

function completeGoal(goal: ExtractedGoal, reportYear: string | undefined) {
  const withBaseYear = { ...goal, ...resolveBaseYear(goal, reportYear) }
  return { ...withBaseYear, horizon: classifyHorizon(withBaseYear) }
}

function completeGoalsInAnswer(
  answer: string | undefined,
  reportYear: string | undefined
) {
  if (!answer) return answer
  const result = JSON.parse(answer)
  const goals: ExtractedGoal[] = result.value?.goals ?? []
  result.value = {
    ...result.value,
    goals: goals.map((goal) => completeGoal(goal, reportYear)),
  }
  return JSON.stringify(result)
}

const queryTexts = [
  'Climate goals',
  'Emission reduction targets',
  'Company sustainability goals',
  'Net zero and SBTi targets',
  'Base year for climate targets',
]

const goals = new FollowUpWorker<FollowUpGoalsJob>(
  QUEUE_NAMES.FOLLOW_UP_GOALS,
  async (job) => {
    const { url, previousAnswer } = job.data
    const reportYear = resolveReportYear(job.data)
    const answer = await job.followUp(
      url,
      previousAnswer,
      schema,
      buildPrompt(reportYear),
      queryTexts,
      FollowUpType.Goals
    )
    return completeGoalsInAnswer(answer, reportYear)
  }
)

export default goals
