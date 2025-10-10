#!/usr/bin/env node

import { parseArgs } from './cli'
import { DEFAULT_RUNS_PER_TEST, loadTestFiles, loadTestSuite } from './utils'
import { ComparisonConfig, ComparisonOptions } from './types'
import { runComparisonTest, printComparisonSummary } from './comparison-test'

const main = async () => {
  const args = process.argv.slice(2)

  console.log(`🔧 run-suite.ts received arguments: ${args.join(' ')}`)

  const { suiteName, options } = parseArgs(args)

  const {
    yearsToCheck = [],
    fileNamesToCheck = [],
    runsPerTest = DEFAULT_RUNS_PER_TEST,
  } = options as ComparisonOptions

  console.log('— Run Configuration —')
  console.log(`Suite: ${suiteName}`)
  console.log(`Runs per test: ${runsPerTest}`)
  console.log(
    `Files: ${fileNamesToCheck?.length ? fileNamesToCheck.join(', ') : 'ALL'}`,
  )
  console.log(
    `Years: ${yearsToCheck?.length ? yearsToCheck.join(', ') : 'ALL'}`,
  )
  console.log('———————————————')

  try {
    const testSuite = await loadTestSuite(suiteName)
    const testFiles = loadTestFiles(
      suiteName,
      testSuite,
      yearsToCheck ?? [],
      fileNamesToCheck ?? [],
    )

    const prompts = testSuite.testVariations.map((v) => ({
      ...v,
      askOptions: {
        ...(testSuite.askOptionsDefault || {}),
        ...(v.askOptions || {}),
      },
    }))

    if (testFiles.length === 0) {
      console.error(
        '❌ No test files found. Please add .md/.txt files with corresponding expected results to the input/ directory',
      )
      process.exit(1)
    }

    const config: ComparisonConfig = {
      prompts,
      testFiles,
      baseSchema: prompts[0].schema,
      runsPerTest,
      outputDir: `../${suiteName}/tests/comparison_results`,
      yearsToCheck: yearsToCheck ?? [],
      fileNamesToCheck: fileNamesToCheck ?? [],
    }

    const report = await runComparisonTest(config)
    printComparisonSummary(report, config)

    console.log('\n🎉 Comparison test completed!')
    console.log(
      `📊 Total tests run: ${config.prompts.length * config.testFiles.length * config.runsPerTest}`,
    )
  } catch (error) {
    console.error(`❌ Error running comparison test:`, error)
    process.exit(1)
  }
}

main().catch(console.error)
