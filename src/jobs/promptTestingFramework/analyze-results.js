import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// =========================================================================
// CLI PARSING
// =========================================================================

const printUsage = () => {
  console.error('Usage: node analyze-results.js <test-suite-name> [options]')
  console.error('')
  console.error('Examples:')
  console.error('  node analyze-results.js scope12')
  console.error(
    '  node analyze-results.js scope12 --prompt bbf507516a060b5c --schema 21972b07d7e48a75'
  )
  console.error('')
  console.error('Options:')
  console.error('  --prompt <hash>     Prompt hash to analyze')
  console.error('  --schema <hash>     Schema hash to analyze')
  console.error(
    '  --list-hashes       List prompt/schema combinations found in results'
  )
  console.error('  --help              Show this help')
}

const parseArgs = (argv) => {
  const args = argv.slice(2)

  if (args.length === 0 || args.includes('--help')) {
    printUsage()
    process.exit(args.includes('--help') ? 0 : 1)
  }

  const suiteName = args[0]
  const options = {
    promptHash: undefined,
    schemaHash: undefined,
    listOnly: false,
  }

  for (let i = 1; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
      case '--prompt':
        options.promptHash = args[i + 1]
        i++
        break
      case '--schema':
        options.schemaHash = args[i + 1]
        i++
        break
      case '--list-hashes':
        options.listOnly = true
        break
      default:
        // ignore unknown args for forward-compat
        break
    }
  }

  return { suiteName, options }
}

// =========================================================================
// PATH RESOLUTION
// =========================================================================

const resolveResultsDir = (suiteName) => {
  return join(__dirname, '..', suiteName, 'tests', 'comparison_results')
}

// =========================================================================
// LOADERS
// =========================================================================

const loadHashMappings = (resultsDir) => {
  const hashMappingsFile = join(resultsDir, 'hashMappings.json')
  if (!existsSync(hashMappingsFile)) return { prompts: {}, schemas: {} }

  try {
    return JSON.parse(readFileSync(hashMappingsFile, 'utf-8'))
  } catch (error) {
    console.warn('Could not load hash mappings:', error.message)
    return { prompts: {}, schemas: {} }
  }
}

const listAvailableHashes = (
  resultsDir,
  limitFiles = 150,
  limitOutput = 20
) => {
  if (!existsSync(resultsDir)) return []
  const files = readdirSync(resultsDir)
  const resultFiles = files.filter(
    (f) => f.startsWith('comparison_test_') && f.endsWith('.json')
  )

  const combos = new Set()
  for (const file of resultFiles.slice(0, limitFiles)) {
    try {
      const filePath = join(resultsDir, file)
      const data = JSON.parse(readFileSync(filePath, 'utf-8'))
      ;(data.detailedResults || []).forEach((r) => {
        if (r.promptHash && r.schemaHash) {
          combos.add(`${r.promptHash}:${r.schemaHash}:${r.promptName}`)
        }
      })
    } catch {
      // skip
    }
  }
  return Array.from(combos)
    .slice(0, limitOutput)
    .map((s) => {
      const [promptHash, schemaHash, promptName] = s.split(':')
      return { promptHash, schemaHash, promptName }
    })
}

const loadAllResults = (resultsDir, targetPromptHash, targetSchemaHash) => {
  if (!existsSync(resultsDir)) {
    console.error(`Results directory does not exist: ${resultsDir}`)
    return []
  }

  const files = readdirSync(resultsDir)
  const resultFiles = files.filter(
    (f) => f.startsWith('comparison_test_') && f.endsWith('.json')
  )

  const allResults = []
  for (const file of resultFiles) {
    try {
      const filePath = join(resultsDir, file)
      const data = JSON.parse(readFileSync(filePath, 'utf-8'))
      const matches = (data.detailedResults || []).filter((result) => {
        const promptMatches = targetPromptHash
          ? result.promptHash === targetPromptHash
          : true
        const schemaMatches = targetSchemaHash
          ? result.schemaHash === targetSchemaHash
          : true
        return promptMatches && schemaMatches
      })
      if (matches.length > 0) {
        allResults.push(
          ...matches.map((r) => ({
            ...r,
            sourceFile: file,
            timestamp: data.timestamp,
          }))
        )
      }
    } catch (error) {
      console.warn(`Could not parse ${file}:`, error.message)
    }
  }
  return allResults
}

// =========================================================================
// ANALYSIS
// =========================================================================

const calculateAggregateStats = (results) => {
  if (results.length === 0) return null

  const byFile = {}
  results.forEach((r) => {
    byFile[r.fileName] = byFile[r.fileName] || []
    byFile[r.fileName].push(r)
  })

  const totalTests = results.reduce((sum, r) => sum + r.runs.length, 0)
  const totalCorrect = results.reduce(
    (sum, r) => sum + (r.accuracy / 100) * r.runs.length,
    0
  )
  const overallAccuracy = totalTests > 0 ? (totalCorrect / totalTests) * 100 : 0
  const avgResponseTime =
    results.reduce((sum, r) => sum + r.avgResponseTime, 0) / results.length
  const avgSuccessRate =
    results.reduce((sum, r) => sum + r.successRate, 0) / results.length

  const fileBreakdown = Object.entries(byFile)
    .map(([fileName, fileResults]) => {
      const fileTests = fileResults.reduce((sum, r) => sum + r.runs.length, 0)
      const fileCorrect = fileResults.reduce(
        (sum, r) => sum + (r.accuracy / 100) * r.runs.length,
        0
      )
      const accuracy = fileTests > 0 ? (fileCorrect / fileTests) * 100 : 0
      const fileAvgTime =
        fileResults.reduce((sum, r) => sum + r.avgResponseTime, 0) /
        fileResults.length
      return {
        fileName,
        runs: fileTests,
        accuracy,
        avgResponseTime: fileAvgTime,
        testSessions: fileResults.length,
      }
    })
    .sort((a, b) => b.accuracy - a.accuracy)

  const timeline = results
    .map((r) => ({
      timestamp: r.timestamp,
      fileName: r.fileName,
      accuracy: r.accuracy,
      sourceFile: r.sourceFile,
    }))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

  return {
    overview: {
      totalTestSessions: results.length,
      totalRuns: totalTests,
      overallAccuracy,
      avgResponseTime,
      avgSuccessRate,
    },
    fileBreakdown,
    timeline,
  }
}

// =========================================================================
// PRINTERS
// =========================================================================

const printHeader = (title) => {
  console.log(title)
  console.log('='.repeat(50))
}

const printOverview = (stats) => {
  printHeader('\n📊 AGGREGATE STATISTICS')
  console.log(`Total Test Sessions: ${stats.overview.totalTestSessions}`)
  console.log(`Total Runs: ${stats.overview.totalRuns}`)
  console.log(`Overall Accuracy: ${stats.overview.overallAccuracy.toFixed(1)}%`)
  console.log(
    `Avg Response Time: ${stats.overview.avgResponseTime.toFixed(0)}ms`
  )
  console.log(`Avg Success Rate: ${stats.overview.avgSuccessRate.toFixed(1)}%`)
}

const printPerFile = (stats) => {
  printHeader('\n📄 PER-FILE BREAKDOWN')
  stats.fileBreakdown.forEach((file, index) => {
    console.log(`${index + 1}. ${file.fileName}`)
    console.log(
      `   Accuracy: ${file.accuracy.toFixed(1)}% (${file.runs} runs across ${file.testSessions} sessions)`
    )
    console.log(`   Avg Response Time: ${file.avgResponseTime.toFixed(0)}ms`)
  })
}

const printTimeline = (stats) => {
  printHeader('\n📈 TIMELINE')
  stats.timeline.forEach((entry) => {
    const date = new Date(entry.timestamp).toLocaleString()
    console.log(
      `${date} | ${entry.fileName} | ${entry.accuracy.toFixed(1)}% | ${entry.sourceFile}`
    )
  })
}

const printPromptSchemaPreview = (hashMappings, promptHash, schemaHash) => {
  if (promptHash && hashMappings.prompts[promptHash]) {
    console.log(
      `\n📝 Prompt Preview: ${hashMappings.prompts[promptHash].substring(0, 100)}...`
    )
  }
  if (schemaHash && hashMappings.schemas[schemaHash]) {
    const schema = hashMappings.schemas[schemaHash]
    const schemaType =
      typeof schema === 'object' && schema
        ? schema.type || 'Unknown'
        : 'Unknown'
    console.log(`\n📋 Schema Type: ${schemaType}`)
  }
}

const printAvailableHashes = (resultsDir) => {
  const combos = listAvailableHashes(resultsDir)
  if (combos.length === 0) {
    console.log('No hashes found in results.')
    return
  }
  console.log('Available prompt/schema combinations (subset):')
  combos.forEach((c) => {
    console.log(
      `  Prompt: ${c.promptHash}, Schema: ${c.schemaHash} (${c.promptName})`
    )
  })
}

// =========================================================================
// MAIN
// =========================================================================

const main = () => {
  const { suiteName, options } = parseArgs(process.argv)
  const resultsDir = resolveResultsDir(suiteName)

  console.log('\n🔍 PROMPT/SCHEMA ANALYSIS')
  console.log('='.repeat(50))
  console.log(`Test Suite: ${suiteName}`)
  console.log(`Results Directory: ${resultsDir}`)
  if (options.promptHash)
    console.log(`Target Prompt Hash: ${options.promptHash}`)
  if (options.schemaHash)
    console.log(`Target Schema Hash: ${options.schemaHash}`)

  if (options.listOnly) {
    printAvailableHashes(resultsDir)
    return
  }

  const hashMappings = loadHashMappings(resultsDir)
  printPromptSchemaPreview(hashMappings, options.promptHash, options.schemaHash)

  console.log('\n🔍 Loading results...')
  const results = loadAllResults(
    resultsDir,
    options.promptHash,
    options.schemaHash
  )

  if (results.length === 0) {
    console.log('❌ No matching results found for the specified criteria.')
    console.log('')
    printAvailableHashes(resultsDir)
    return
  }

  console.log(
    `\n✅ Found ${results.length} test sessions matching the criteria`
  )

  const stats = calculateAggregateStats(results)
  if (!stats) {
    console.log('No stats to show.')
    return
  }

  printOverview(stats)
  printPerFile(stats)
  printTimeline(stats)
}

main()
