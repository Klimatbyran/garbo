import { extractDataFromMarkdown } from '../utils/extractWithAI'
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { z } from 'zod'
import { createHash } from 'crypto'
import { zodToJsonSchema } from 'zod-to-json-schema'

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

const HASH_LENGTH = 16
const TOP_FAILURE_PATTERNS = 5
const BEST_WORST_FILES_LIMIT = 3
const DIFFICULTY_THRESHOLDS = {
  EASY: 80,
  MEDIUM: 60,
} as const

const SKIPPED_FIELDS = [
  'unit',
  'mentionOfLocationBasedOrMarketBased',
  'explanationOfWhyYouPutValuesToMbOrLbOrUnknown',
  'absoluteMostRecentYearInReport',
  'mbValuesWeNeedToSummarize',
  'lbValuesWeNeedToSummarize',
  'fullScope2mbValuesWeNeedToSummarize',
  'fullScope2lbValuesWeNeedToSummarize',
  'fullUnknownScope2ValuesWeNeedToSummarize',
  'listOfAvailablePureScope1Numbers',
  'listOfAvailableCombinedScope1And2Numbers',
  'listOfAllAvailableScope1Numbers',
  'listOfAvailableScope1Numbers',
  'listOfAllAvailableScope2NumbersAndTheirMethods',
  'areScope1And2NumbersCombinedOnlyInOneField',
  'listOfAvailableUncombinedScope1Numbers',
  'listOfAllExplicitScope2NumbersAndTheirMethods',
  'listOfScope1Numbers',
  'listOfFullScope2CompleteValues',
  'listOfSummarizedElectricityAndHeatingValuesToGetFullScope2Values',
  'listOfMaxThreeSummarizedElectricityAndHeatingValuesToGetFullScope2Values',
  'listOfAllPossibleScope1Numbers',
  'numbersToSummarizeToGetTotalScope1',
  'listOfAllScope2NumbersForThisYearAndTheirMethods',
] as const

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface HashMappings {
  prompts: Record<string, string>
  schemas: Record<string, any>
}

interface TestFile {
  name: string
  markdown: string
  expectedResult: any
}

interface PromptConfig {
  name: string
  prompt: string
  schema?: z.ZodSchema
  baseline?: boolean
}

interface ComparisonTestConfig {
  prompts: PromptConfig[]
  testFiles: TestFile[]
  baseSchema: z.ZodSchema
  runsPerTest: number
  outputDir: string
  yearsToCheck?: number[]
  fileNamesToCheck?: string[]
  dataKey?: string
}

interface JsonDiff {
  path: string
  expected: any
  actual: any
  type: 'missing' | 'extra' | 'different' | 'type_mismatch' | 'unexpected_value'
}

interface TestResult {
  promptName: string
  fileName: string
  accuracy: number
  avgResponseTime: number
  successRate: number
  runs: any[]
  timings: number[]
  failures: Array<{
    runIndex: number
    diffs: JsonDiff[]
  }>
  promptHash: string
  schemaHash: string
  fileHash?: string
}

interface ComparisonReport {
  timestamp: string
  config: {
    totalTests: number
    runsPerTest: number
    prompts: string[]
    testFiles: string[]
  }
  promptComparison: {
    [promptName: string]: {
      overallAccuracy: number
      avgResponseTime: number
      successRate: number
      bestPerformingFiles: string[]
      worstPerformingFiles: string[]
      totalCorrect: number
      totalTests: number
    }
  }
  fileComparison: {
    [fileName: string]: {
      promptRankings: Array<{
        promptName: string
        accuracy: number
        avgResponseTime: number
      }>
      difficulty: 'easy' | 'medium' | 'hard'
    }
  }
  detailedResults: TestResult[]
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const hashString = (str: string): string => {
  return createHash('sha256')
    .update(str)
    .digest('hex')
    .substring(0, HASH_LENGTH)
}

const hashPrompt = (prompt: string): string => hashString(prompt)

const hashSchema = (schema: z.ZodSchema): string =>
  hashString(JSON.stringify(schema._def))

const getCurrentDir = (): string => {
  return dirname(fileURLToPath(import.meta.url))
}

const shouldSkipField = (fieldName: string): boolean => {
  return SKIPPED_FIELDS.includes(fieldName as any)
}

const calculateAverage = (numbers: number[]): number => {
  return numbers.length > 0
    ? numbers.reduce((a, b) => a + b, 0) / numbers.length
    : 0
}

const determineDifficulty = (
  avgAccuracy: number,
): 'easy' | 'medium' | 'hard' => {
  if (avgAccuracy >= DIFFICULTY_THRESHOLDS.EASY) return 'easy'
  if (avgAccuracy >= DIFFICULTY_THRESHOLDS.MEDIUM) return 'medium'
  return 'hard'
}

// ============================================================================
// JSON COMPARISON LOGIC
// ============================================================================

const handleNullComparison = (
  expected: any,
  actual: any,
  path: string,
): JsonDiff[] => {
  if (expected === null && actual === null) return []
  if (expected === null && actual !== null) {
    return [{ path, expected: null, actual, type: 'unexpected_value' }]
  }
  if (expected !== null && actual === null) {
    return [{ path, expected, actual: null, type: 'missing' }]
  }

  if (expected === undefined && actual === undefined) return []
  if (expected === undefined && actual !== undefined) {
    return [{ path, expected: undefined, actual, type: 'unexpected_value' }]
  }
  if (expected !== undefined && actual === undefined) {
    return [{ path, expected, actual: undefined, type: 'missing' }]
  }

  return []
}

const handlePrimitiveComparison = (
  expected: any,
  actual: any,
  path: string,
): JsonDiff[] => {
  if (expected !== actual) {
    // Special handling for numbers - check for precision differences
    if (typeof expected === 'number' && typeof actual === 'number') {
      const expectedDecimals = (expected.toString().split('.')[1] || '').length
      const actualDecimals = (actual.toString().split('.')[1] || '').length
      const minDecimals = Math.min(expectedDecimals, actualDecimals)

      const roundedExpected = Number(expected.toFixed(minDecimals))
      const roundedActual = Number(actual.toFixed(minDecimals))

      if (roundedExpected === roundedActual) {
        console.log(
          `⚠️  Precision difference at ${path}: expected ${expected}, got ${actual} (rounded to ${minDecimals} decimals: both ${roundedExpected})`,
        )
        return [] // Don't add to diffs - not counted as error
      }
    }

    return [{ path, expected, actual, type: 'different' }]
  }
  return []
}

const handleArrayComparison = (
  expected: any[],
  actual: any[],
  path: string,
): JsonDiff[] => {
  if (!Array.isArray(actual)) {
    return [{ path, expected, actual, type: 'type_mismatch' }]
  }

  const diffs: JsonDiff[] = []
  const maxLength = Math.max(expected.length, actual.length)

  for (let i = 0; i < maxLength; i++) {
    const newPath = path ? `${path}[${i}]` : `[${i}]`

    if (i >= expected.length) {
      diffs.push({
        path: newPath,
        expected: undefined,
        actual: actual[i],
        type: 'extra',
      })
    } else if (i >= actual.length) {
      diffs.push({
        path: newPath,
        expected: expected[i],
        actual: undefined,
        type: 'missing',
      })
    } else {
      diffs.push(...compareJson(expected[i], actual[i], newPath))
    }
  }

  return diffs
}

const handleObjectComparison = (
  expected: any,
  actual: any,
  path: string,
): JsonDiff[] => {
  // Check for null/undefined first
  const nullDiffs = handleNullComparison(expected, actual, path)
  if (nullDiffs.length > 0) return nullDiffs

  // Ensure both are objects
  if (typeof expected !== 'object' || typeof actual !== 'object') {
    return [{ path, expected, actual, type: 'type_mismatch' }]
  }

  // Additional safety check
  if (
    expected === null ||
    expected === undefined ||
    actual === null ||
    actual === undefined
  ) {
    return []
  }

  const expectedKeys = Object.keys(expected)
  const actualKeys = Object.keys(actual)
  const allKeys = new Set([...expectedKeys, ...actualKeys])
  const diffs: JsonDiff[] = []

  for (const key of allKeys) {
    if (shouldSkipField(key)) {
      continue
    }

    const newPath = path ? `${path}.${key}` : key

    if (!(key in expected)) {
      diffs.push({
        path: newPath,
        expected: undefined,
        actual: actual[key],
        type: 'extra',
      })
    } else if (!(key in actual)) {
      diffs.push({
        path: newPath,
        expected: expected[key],
        actual: undefined,
        type: 'missing',
      })
    } else {
      diffs.push(...compareJson(expected[key], actual[key], newPath))
    }
  }

  return diffs
}

const compareJson = (
  expected: any,
  actual: any,
  path: string = '',
): JsonDiff[] => {
  // Handle null/undefined cases
  const nullDiffs = handleNullComparison(expected, actual, path)
  if (nullDiffs.length > 0) return nullDiffs

  // Handle type mismatches
  if (typeof expected !== typeof actual) {
    return [{ path, expected, actual, type: 'type_mismatch' }]
  }

  // Handle primitives
  if (typeof expected !== 'object') {
    return handlePrimitiveComparison(expected, actual, path)
  }

  // Handle arrays
  if (Array.isArray(expected)) {
    return handleArrayComparison(expected, actual, path)
  }

  // Handle objects
  return handleObjectComparison(expected, actual, path)
}

// ============================================================================
// HASH MAPPINGS MANAGEMENT
// ============================================================================

const loadHashMappings = (outputDir: string): HashMappings => {
  const currentDir = getCurrentDir()
  const hashMappingsFile = join(currentDir, outputDir, 'hashMappings.json')

  if (!existsSync(hashMappingsFile)) {
    return { prompts: {}, schemas: {} }
  }

  try {
    const hashMappings = JSON.parse(readFileSync(hashMappingsFile, 'utf-8'))
    console.log(
      `📖 Loaded existing hash mappings: ${Object.keys(hashMappings.prompts).length} prompts, ${Object.keys(hashMappings.schemas).length} schemas`,
    )
    return hashMappings
  } catch (error) {
    console.warn(`⚠️  Could not load existing hash mappings: ${error}`)
    return { prompts: {}, schemas: {} }
  }
}

const updateHashMappings = (
  hashMappings: HashMappings,
  promptHash: string,
  schemaHash: string,
  promptText: string,
  schema: z.ZodSchema,
): void => {
  if (!hashMappings.prompts[promptHash]) {
    hashMappings.prompts[promptHash] = promptText
  }
  if (!hashMappings.schemas[schemaHash]) {
    hashMappings.schemas[schemaHash] = zodToJsonSchema(schema)
  }
}

const saveHashMappings = (
  hashMappings: HashMappings,
  outputDir: string,
): void => {
  const currentDir = getCurrentDir()
  const hashMappingsFile = join(currentDir, outputDir, 'hashMappings.json')
  writeFileSync(hashMappingsFile, JSON.stringify(hashMappings, null, 2))
  console.log(
    `📁 Hash mappings updated: ${Object.keys(hashMappings.prompts).length} prompts, ${Object.keys(hashMappings.schemas).length} schemas`,
  )
}

// ============================================================================
// TEST EXECUTION
// ============================================================================

const executeTestRun = async (
  markdown: string,
  prompt: string,
  schema: z.ZodSchema,
  dataKey: string,
): Promise<{ result: any; duration: number }> => {
  const runStartTime = Date.now()
  const result = await extractDataFromMarkdown(
    markdown,
    dataKey,
    prompt,
    schema,
  )
  return {
    result,
    duration: Date.now() - runStartTime,
  }
}

const executeMultipleRuns = async (
  testFile: TestFile,
  promptConfig: PromptConfig,
  baseSchema: z.ZodSchema,
  runsPerTest: number,
  dataKey: string,
): Promise<{
  runs: any[]
  timings: number[]
  validRuns: any[]
  parsedRuns: any[]
}> => {
  const schema = promptConfig.schema || baseSchema

  const promises = Array.from({ length: runsPerTest }, () =>
    executeTestRun(testFile.markdown, promptConfig.prompt, schema, dataKey),
  )

  const settledResults = await Promise.allSettled(promises)
  const runs = settledResults.map((r) =>
    r.status === 'fulfilled' ? r.value.result : null,
  )
  const timings = settledResults
    .map((r) => (r.status === 'fulfilled' ? r.value.duration : null))
    .filter((t) => t !== null) as number[]

  const validRuns = runs.filter((r) => r !== null)

  const safeParse = (s: string) => {
    try {
      return JSON.parse(s)
    } catch (e: any) {
      const m = String(e?.message || '')
      const pos = Number(m.match(/position (\d+)/)?.[1] || 0)
      const start = Math.max(0, pos - 200)
      const end = Math.min(s.length, pos + 200)
      console.error(
        'Invalid JSON near position',
        pos,
        '\n---\n' + s.slice(start, end) + '\n---',
      )
      // Dump the raw JSON to tests/errors for debugging
      try {
        const currentDir = getCurrentDir()
        const errorsDir = join(
          currentDir,
          'src',
          'jobs',
          'scope3',
          'tests',
          'errors',
        )
        if (!existsSync(errorsDir)) mkdirSync(errorsDir, { recursive: true })
        const ts = new Date().toISOString().replace(/[:.]/g, '-')
        const file = join(errorsDir, `invalid_json_${ts}.json`)
        writeFileSync(file, s)
        console.error('💾 Saved invalid JSON to', file)
      } catch {}
      throw e
    }
  }

  const parsedRuns = validRuns.map((run) =>
    typeof run === 'string' ? safeParse(run) : run,
  )

  return { runs, timings, validRuns, parsedRuns }
}

const filterRunByYears = (
  run: any,
  yearsToCheck?: number[],
  dataKey: string = 'scope12',
): any => {
  if (
    !yearsToCheck ||
    yearsToCheck.length === 0 ||
    !run ||
    !Array.isArray(run[dataKey])
  ) {
    return run
  }

  return {
    ...run,
    [dataKey]: run[dataKey].filter((item: any) =>
      yearsToCheck.includes(item.year),
    ),
  }
}

//this fills in missing categories for the test comparison, and makes sure they are in the correct order.
const normalizeScope3Categories = (data: any): any => {
  if (!data) return data
  const cloned = JSON.parse(JSON.stringify(data))
  const yearly = cloned?.scope3
  if (!Array.isArray(yearly)) return cloned

  cloned.scope3 = yearly.map((yr: any) => {
    const cats = yr?.scope3?.categories
    const byId = new Map<number, any>()
    if (Array.isArray(cats)) {
      for (const c of cats) {
        if (c && typeof c.category === 'number') byId.set(c.category, c)
      }
    }
    const filled = Array.from({ length: 15 }, (_, i) => {
      const id = i + 1
      return byId.get(id) ?? { category: id, total: null, unit: null }
    }).sort((a, b) => a.category - b.category)

    return {
      ...yr,
      scope3: yr?.scope3 ? { ...yr.scope3, categories: filled } : yr?.scope3,
    }
  })

  return cloned
}

const calculateTestMetrics = (
  parsedRuns: any[],
  validRuns: any[],
  runs: any[],
  timings: number[],
  testFile: TestFile,
  config: ComparisonTestConfig,
): {
  accuracy: number
  successRate: number
  avgResponseTime: number
  failures: Array<{ runIndex: number; diffs: JsonDiff[] }>
  correctRuns: any[]
} => {
  const failures: Array<{ runIndex: number; diffs: JsonDiff[] }> = []
  const correctRuns = parsedRuns.filter((run, index) => {
    const filteredRun = filterRunByYears(
      run,
      config.yearsToCheck,
      config.dataKey || 'scope12',
    )

    const expectedForCompare =
      config.dataKey === 'scope3'
        ? normalizeScope3Categories(testFile.expectedResult)
        : testFile.expectedResult

    const actualForCompare =
      config.dataKey === 'scope3'
        ? normalizeScope3Categories(filteredRun)
        : filteredRun

    const diffsRaw = compareJson(expectedForCompare, actualForCompare)
    const diffs =
      config.dataKey === 'scope3'
        ? diffsRaw.filter((d) => d.type !== 'extra')
        : diffsRaw

    if (diffs.length > 0) {
      failures.push({ runIndex: index, diffs })
      return false
    }
    return true
  })

  const accuracy =
    validRuns.length > 0 ? (correctRuns.length / validRuns.length) * 100 : 0
  const successRate =
    runs.length > 0 ? (validRuns.length / runs.length) * 100 : 0
  const avgResponseTime = calculateAverage(timings)

  return { accuracy, successRate, avgResponseTime, failures, correctRuns }
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

const generatePromptComparison = (
  results: TestResult[],
  prompts: PromptConfig[],
  runsPerTest: number,
): ComparisonReport['promptComparison'] => {
  const promptComparison: ComparisonReport['promptComparison'] = {}

  for (const promptConfig of prompts) {
    const promptResults = results.filter(
      (r) => r.promptName === promptConfig.name,
    )
    const totalCorrect = promptResults.reduce(
      (sum, r) => sum + (r.accuracy / 100) * runsPerTest,
      0,
    )
    const totalTests = promptResults.length * runsPerTest
    const overallAccuracy =
      totalTests > 0 ? (totalCorrect / totalTests) * 100 : 0
    const avgResponseTime = calculateAverage(
      promptResults.map((r) => r.avgResponseTime),
    )
    const successRate = calculateAverage(
      promptResults.map((r) => r.successRate),
    )

    // Find best and worst performing files
    const sortedByAccuracy = [...promptResults].sort(
      (a, b) => b.accuracy - a.accuracy,
    )
    const bestPerformingFiles = sortedByAccuracy
      .filter((r) => r.accuracy > 0)
      .slice(0, BEST_WORST_FILES_LIMIT)
      .map((r) => r.fileName)
    const worstPerformingFiles = sortedByAccuracy
      .filter((r) => r.accuracy < 100)
      .slice(-BEST_WORST_FILES_LIMIT)
      .map((r) => r.fileName)

    promptComparison[promptConfig.name] = {
      overallAccuracy,
      avgResponseTime,
      successRate,
      bestPerformingFiles,
      worstPerformingFiles,
      totalCorrect: Math.round(totalCorrect),
      totalTests,
    }
  }

  return promptComparison
}

const generateFileComparison = (
  results: TestResult[],
  testFiles: TestFile[],
): ComparisonReport['fileComparison'] => {
  const fileComparison: ComparisonReport['fileComparison'] = {}

  for (const testFile of testFiles) {
    const fileResults = results.filter((r) => r.fileName === testFile.name)
    const promptRankings = fileResults
      .map((r) => ({
        promptName: r.promptName,
        accuracy: r.accuracy,
        avgResponseTime: r.avgResponseTime,
      }))
      .sort((a, b) => b.accuracy - a.accuracy)

    const avgAccuracy = calculateAverage(promptRankings.map((s) => s.accuracy))
    const difficulty = determineDifficulty(avgAccuracy)

    fileComparison[testFile.name] = {
      promptRankings,
      difficulty,
    }
  }

  return fileComparison
}

const generateComparisonReport = (
  results: TestResult[],
  config: ComparisonTestConfig,
): ComparisonReport => {
  const { prompts, testFiles, runsPerTest } = config

  const promptComparison = generatePromptComparison(
    results,
    prompts,
    runsPerTest,
  )
  const fileComparison = generateFileComparison(results, testFiles)

  return {
    timestamp: new Date().toISOString(),
    config: {
      totalTests: prompts.length * testFiles.length,
      runsPerTest,
      prompts: prompts.map((p) => p.name),
      testFiles: testFiles.map((f) => f.name),
    },
    promptComparison,
    fileComparison,
    detailedResults: results,
  }
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

const saveReportToFile = (
  report: ComparisonReport,
  config: ComparisonTestConfig,
): string => {
  const currentDir = getCurrentDir()
  const reportWithConfig = {
    ...report,
    config: {
      ...report.config,
      prompts: config.prompts.map((p) => ({
        name: p.name,
        baseline: p.baseline,
      })),
    },
  }

  const timestamp = new Date().toISOString()
  const filename = `comparison_test_${timestamp.replace(/[:.]/g, '-')}.json`
  const filepath = join(currentDir, config.outputDir, filename)

  if (!existsSync(join(currentDir, config.outputDir))) {
    mkdirSync(join(currentDir, config.outputDir), { recursive: true })
  }

  writeFileSync(filepath, JSON.stringify(reportWithConfig, null, 2))
  console.log(`\n📁 Results saved to: ${filepath}`)

  return filepath
}

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================

export const runComparisonTest = async (
  config: ComparisonTestConfig,
): Promise<ComparisonReport> => {
  const { prompts, testFiles, baseSchema, runsPerTest, outputDir } = config

  console.log(
    `🚀 Starting comparison test with ${prompts.length} prompts and ${testFiles.length} files`,
  )
  console.log(
    `📊 Total tests: ${prompts.length * testFiles.length} (${runsPerTest} runs each)`,
  )

  const results: TestResult[] = []
  const hashMappings = loadHashMappings(outputDir)

  // Run tests for each prompt-file combination (prompts in parallel)
  await Promise.all(
    prompts.map(async (promptConfig) => {
      console.log(`\n🔬 Testing prompt: ${promptConfig.name}`)

      for (const testFile of testFiles) {
        console.log(`  📄 Testing file: ${testFile.name}`)

        const schema = promptConfig.schema || baseSchema
        const promptHash = hashPrompt(promptConfig.prompt)
        const schemaHash = hashSchema(schema)
        const fileHash = hashString(testFile.markdown)

        updateHashMappings(
          hashMappings,
          promptHash,
          schemaHash,
          promptConfig.prompt,
          schema,
        )

        const { runs, timings, validRuns, parsedRuns } =
          await executeMultipleRuns(
            testFile,
            promptConfig,
            baseSchema,
            runsPerTest,
            config.dataKey || 'scope12',
          )

        const {
          accuracy,
          successRate,
          avgResponseTime,
          failures,
          correctRuns,
        } = calculateTestMetrics(
          parsedRuns,
          validRuns,
          runs,
          timings,
          testFile,
          config,
        )

        const testResult: TestResult = {
          promptName: promptConfig.name,
          fileName: testFile.name,
          accuracy,
          avgResponseTime,
          successRate,
          runs: parsedRuns,
          timings,
          failures,
          promptHash,
          schemaHash,
          fileHash,
        }

        results.push(testResult)

        console.log(
          `    ✅ ${testFile.name} - Accuracy: ${accuracy.toFixed(1)}%, Success: ${successRate.toFixed(1)}%`,
        )
        console.log(
          `       🔗 Prompt: ${promptHash}, Schema: ${schemaHash}, File: ${fileHash}`,
        )
      }
    }),
  )

  const report = generateComparisonReport(results, config)
  saveReportToFile(report, config)
  saveHashMappings(hashMappings, outputDir)

  return report
}

// ============================================================================
// SUMMARY AND ANALYSIS FUNCTIONS
// ============================================================================

const printDiffSummary = (
  failures: Array<{ runIndex: number; diffs: JsonDiff[] }>,
  promptName: string,
  fileName: string,
) => {
  if (failures.length === 0) return

  console.log(`\n🔍 Failure Analysis for ${promptName} on ${fileName}:`)

  // Group diffs by path to show patterns
  const diffsByPath: Record<string, JsonDiff[]> = {}
  failures.forEach((failure) => {
    failure.diffs.forEach((diff) => {
      if (!diffsByPath[diff.path]) {
        diffsByPath[diff.path] = []
      }
      diffsByPath[diff.path].push(diff)
    })
  })

  // Show most common failure patterns
  const sortedPaths = Object.entries(diffsByPath)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, TOP_FAILURE_PATTERNS)

  sortedPaths.forEach(([path, diffs]) => {
    console.log(
      `  📍 ${path} (${diffs.length}/${failures.length} runs failed):`,
    )

    // Show examples of the different types of failures for this path
    const examplesByType = diffs.reduce(
      (acc, diff) => {
        if (!acc[diff.type]) {
          acc[diff.type] = diff
        }
        return acc
      },
      {} as Record<string, JsonDiff>,
    )

    Object.entries(examplesByType).forEach(([type, diff]) => {
      switch (type) {
        case 'missing':
          console.log(
            `     ❌ MISSING: Expected ${JSON.stringify(diff.expected)}, got undefined`,
          )
          break
        case 'extra':
          console.log(
            `     ➕ EXTRA: Got ${JSON.stringify(diff.actual)}, expected undefined`,
          )
          break
        case 'unexpected_value':
          console.log(
            `     🚫 UNEXPECTED VALUE: Expected null, got ${JSON.stringify(diff.actual)}`,
          )
          break
        case 'different':
          console.log(
            `     🔄 DIFFERENT: Expected ${JSON.stringify(diff.expected)}, got ${JSON.stringify(diff.actual)}`,
          )
          break
        case 'type_mismatch':
          console.log(
            `     ⚠️  TYPE: Expected ${typeof diff.expected}, got ${typeof diff.actual}`,
          )
          break
      }
    })
  })
}

const calculateImprovements = (
  report: ComparisonReport,
  baselinePromptName: string,
  comparisonPromptName: string,
): string => {
  const baselineResults = report.detailedResults.filter(
    (r) => r.promptName === baselinePromptName,
  )
  const comparisonResults = report.detailedResults.filter(
    (r) => r.promptName === comparisonPromptName,
  )

  let improved = 0
  let gotWorse = 0
  let stayedSame = 0
  const improvedCompanies: string[] = []
  const worseCompanies: string[] = []

  // Compare accuracy for each file
  baselineResults.forEach((baselineResult) => {
    const comparisonResult = comparisonResults.find(
      (r) => r.fileName === baselineResult.fileName,
    )
    if (comparisonResult) {
      if (comparisonResult.accuracy > baselineResult.accuracy) {
        improved++
        improvedCompanies.push(baselineResult.fileName)
      } else if (comparisonResult.accuracy < baselineResult.accuracy) {
        gotWorse++
        worseCompanies.push(baselineResult.fileName)
      } else {
        stayedSame++
      }
    }
  })

  const parts: string[] = []
  if (improved > 0) {
    const companyList =
      improvedCompanies.length <= 3
        ? improvedCompanies.join(', ')
        : `${improvedCompanies.slice(0, 3).join(', ')}, +${improvedCompanies.length - 3} more`
    parts.push(`${improved} improved (${companyList})`)
  }
  if (gotWorse > 0) {
    const companyList =
      worseCompanies.length <= 3
        ? worseCompanies.join(', ')
        : `${worseCompanies.slice(0, 3).join(', ')}, +${worseCompanies.length - 3} more`
    parts.push(`${gotWorse} got worse (${companyList})`)
  }
  if (stayedSame > 0) parts.push(`${stayedSame} unchanged`)

  return parts.join(', ') || 'no changes'
}

const printPromptRankings = (
  report: ComparisonReport,
  config: ComparisonTestConfig,
): void => {
  const baselinePrompt = config.prompts.find((p) => p.baseline)
  const baselinePromptName = baselinePrompt?.name

  const promptRankings = Object.entries(report.promptComparison).sort(
    (a, b) => b[1].overallAccuracy - a[1].overallAccuracy,
  )

  console.log('\n📊 Prompt Performance Rankings:')
  promptRankings.forEach(([name, stats], index) => {
    console.log(
      `${index + 1}. ${name}${name === baselinePromptName ? ' (baseline)' : ''}`,
    )
    console.log(
      `   Accuracy: ${stats.overallAccuracy.toFixed(1)}% (${stats.totalCorrect}/${stats.totalTests})`,
    )
    console.log(`   Avg Response Time: ${stats.avgResponseTime.toFixed(0)}ms`)
    console.log(`   Success Rate: ${stats.successRate.toFixed(1)}%`)
    console.log(`   Best Files: ${stats.bestPerformingFiles.join(', ')}`)
    console.log(`   Worst Files: ${stats.worstPerformingFiles.join(', ')}`)

    // Show improvement comparison against baseline
    if (baselinePromptName && name !== baselinePromptName) {
      const improvementInfo = calculateImprovements(
        report,
        baselinePromptName,
        name,
      )
      console.log(`   📈 vs ${baselinePromptName}: ${improvementInfo}`)
    }

    console.log('')
  })
}

const printFileDifficultyAnalysis = (report: ComparisonReport): void => {
  console.log('\n📄 Test File Difficulty Analysis:')
  const filesByDifficulty = Object.entries(report.fileComparison).reduce(
    (acc, [fileName, data]) => {
      acc[data.difficulty] = acc[data.difficulty] || []
      acc[data.difficulty].push(fileName)
      return acc
    },
    {} as Record<string, string[]>,
  )

  ;['easy', 'medium', 'hard'].forEach((difficulty) => {
    const files = filesByDifficulty[difficulty] || []
    if (files.length > 0) {
      console.log(`${difficulty.toUpperCase()}: ${files.join(', ')}`)
    }
  })
}

const printWinnerAnalysis = (report: ComparisonReport): void => {
  console.log('\n🏆 Winner Analysis:')
  const winnerCounts = Object.values(report.fileComparison).reduce(
    (acc, fileData) => {
      const topRanking = fileData.promptRankings[0]
      const secondRanking = fileData.promptRankings[1]

      // Only count as winner if they actually have > 0% accuracy
      // and are clearly better than second place (or second place doesn't exist)
      if (topRanking && topRanking.accuracy > 0) {
        if (!secondRanking || topRanking.accuracy > secondRanking.accuracy) {
          acc[topRanking.promptName] = (acc[topRanking.promptName] || 0) + 1
        }
      }

      return acc
    },
    {} as Record<string, number>,
  )

  if (Object.keys(winnerCounts).length === 0) {
    console.log('No clear winners - all variations performed equally (poorly)')
  } else {
    Object.entries(winnerCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([prompt, wins]) => {
        console.log(`${prompt}: ${wins} file wins`)
      })
  }
}

const printDetailedFailureAnalysis = (report: ComparisonReport): void => {
  console.log('\n📊 Detailed Failure Analysis:')
  const failedResults = report.detailedResults.filter(
    (result) => result.failures.length > 0,
  )

  failedResults.forEach((result, index) => {
    if (index > 0) {
      console.log('\n' + '='.repeat(60))
    }
    printDiffSummary(result.failures, result.promptName, result.fileName)
  })
}

// ============================================================================
// MAIN SUMMARY FUNCTION
// ============================================================================

export const printComparisonSummary = (
  report: ComparisonReport,
  config: ComparisonTestConfig,
) => {
  console.log('\n🎯 PROMPT COMPARISON TEST SUMMARY')
  console.log('='.repeat(50))

  printPromptRankings(report, config)
  printFileDifficultyAnalysis(report)
  printWinnerAnalysis(report)
  printDetailedFailureAnalysis(report)
}
