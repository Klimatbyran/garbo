import { extractDataFromMarkdown } from "../../utils/extractWithAI"
import { prompt } from "../prompt"
import { writeFileSync, existsSync, mkdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { z } from "zod"

export const testAccuracy = async (markdown: string, expectedResult: any, schema: z.ZodSchema, numberOfRuns: number, testName?: string) => {
  // Run 10 times in parallel
  const promises = Array.from({ length: numberOfRuns }, () => 
    extractDataFromMarkdown(markdown, 'scope12', prompt, schema)
  )
  
  const results = await Promise.allSettled(promises)
  const runs = results.map(result => 
    result.status === 'fulfilled' ? result.value : null
  )


  console.log("runs")
  //json parse here to see if it's a string
  const parsedRuns = runs.map(run => typeof run === 'string' ? JSON.parse(run) : run)
  console.log("Parsed runs:")
  parsedRuns.forEach((run, i) => {
    console.log(`Run ${i + 1}:`, JSON.stringify(run, null, 2))
  })

  console.log("Expected result:")
  console.log(JSON.stringify(expectedResult, null, 2))

  // Calculate accuracy
  const validRuns = runs.filter(r => r !== null)
  const correctRuns = validRuns.filter(run => {
    // Parse run if it's a string, otherwise use as-is
    const parsedRun = typeof run === 'string' ? JSON.parse(run) : run
    return JSON.stringify(parsedRun) === JSON.stringify(expectedResult)
  })
  
  const accuracy = validRuns.length > 0 ? (correctRuns.length / validRuns.length) * 100 : 0
  
  console.log(`Accuracy: ${accuracy.toFixed(1)}% (${correctRuns.length}/${validRuns.length} correct)`)
  
  // Save results to JSON
  const timestamp = new Date().toISOString()
  const testData = {
    timestamp,
    testName: testName || 'unnamed_test',
    results: {
        accuracy,
        totalRuns: runs.length,
        successfulRuns: validRuns.length,
        correctRuns: correctRuns.length,
        allRuns: runs
      },
      expectedResult,
      prompt,
      schema,
      markdown,

  }
  
  const filename = `accuracy_test_${timestamp.replace(/[:.]/g, '-')}.json`
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const filepath = join(__dirname, 'results', filename)
  
  // Ensure results directory exists
  const resultsDir = join(__dirname, 'results')
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true })
  }
  
  writeFileSync(filepath, JSON.stringify(testData, null, 2))
  console.log(`Results saved to: ${filepath}`)
  
  return { accuracy, runs, testData }
}
