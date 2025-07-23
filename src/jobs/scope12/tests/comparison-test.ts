import { extractDataFromMarkdown } from "../../utils/extractWithAI"
import { writeFileSync, existsSync, mkdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { z } from "zod"

// Deep comparison function to find differences between expected and actual JSON
const compareJson = (expected: any, actual: any, path: string = ''): JsonDiff[] => {
  const diffs: JsonDiff[] = [];
  
  // Handle null/undefined cases
  if (expected === null && actual === null) return diffs;
  if (expected === null && actual !== null) {
    diffs.push({ path, expected: null, actual, type: 'unexpected_value' });
    return diffs;
  }
  if (expected !== null && actual === null) {
    diffs.push({ path, expected, actual: null, type: 'missing' });
    return diffs;
  }
  
  // Handle type mismatches
  if (typeof expected !== typeof actual) {
    diffs.push({ path, expected, actual, type: 'type_mismatch' });
    return diffs;
  }
  
  // Handle primitives
  if (typeof expected !== 'object') {
    if (expected !== actual) {
      diffs.push({ path, expected, actual, type: 'different' });
    }
    return diffs;
  }
  
  // Handle arrays
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) {
      diffs.push({ path, expected, actual, type: 'type_mismatch' });
      return diffs;
    }
    
    const maxLength = Math.max(expected.length, actual.length);
    for (let i = 0; i < maxLength; i++) {
      const newPath = path ? `${path}[${i}]` : `[${i}]`;
      
      if (i >= expected.length) {
        diffs.push({ path: newPath, expected: undefined, actual: actual[i], type: 'extra' });
      } else if (i >= actual.length) {
        diffs.push({ path: newPath, expected: expected[i], actual: undefined, type: 'missing' });
      } else {
        diffs.push(...compareJson(expected[i], actual[i], newPath));
      }
    }
    return diffs;
  }
  
  // Handle objects
  const expectedKeys = Object.keys(expected);
  const actualKeys = Object.keys(actual);
  const allKeys = new Set([...expectedKeys, ...actualKeys]);
  
  for (const key of allKeys) {
    const newPath = path ? `${path}.${key}` : key;
    
    if (!(key in expected)) {
      diffs.push({ path: newPath, expected: undefined, actual: actual[key], type: 'extra' });
    } else if (!(key in actual)) {
      diffs.push({ path: newPath, expected: expected[key], actual: undefined, type: 'missing' });
    } else {
      diffs.push(...compareJson(expected[key], actual[key], newPath));
    }
  }
  
  return diffs;
};

interface TestFile {
  name: string;
  markdown: string;
  expectedResult: any;
}

interface PromptConfig {
  name: string;
  prompt: string;
  schema?: z.ZodSchema; // Optional schema override
}

interface ComparisonTestConfig {
  prompts: PromptConfig[];
  testFiles: TestFile[];
  baseSchema: z.ZodSchema;
  runsPerTest: number;
  outputDir: string;
}

interface JsonDiff {
  path: string;
  expected: any;
  actual: any;
  type: 'missing' | 'extra' | 'different' | 'type_mismatch' | 'unexpected_value';
}

interface TestResult {
  promptName: string;
  fileName: string;
  accuracy: number;
  avgResponseTime: number;
  successRate: number;
  runs: any[];
  timings: number[];
  failures: Array<{
    runIndex: number;
    diffs: JsonDiff[];
  }>;
}

interface ComparisonReport {
  timestamp: string;
  config: {
    totalTests: number;
    runsPerTest: number;
    prompts: string[];
    testFiles: string[];
  };
  promptComparison: {
    [promptName: string]: {
      overallAccuracy: number;
      avgResponseTime: number;
      successRate: number;
      bestPerformingFiles: string[];
      worstPerformingFiles: string[];
      totalCorrect: number;
      totalTests: number;
    };
  };
  fileComparison: {
    [fileName: string]: {
      promptRankings: Array<{
        promptName: string;
        accuracy: number;
        avgResponseTime: number;
      }>;
      difficulty: 'easy' | 'medium' | 'hard';
    };
  };
  detailedResults: TestResult[];
}

export const runComparisonTest = async (config: ComparisonTestConfig): Promise<ComparisonReport> => {
  const { prompts, testFiles, baseSchema, runsPerTest, outputDir } = config;
  
  console.log(`🚀 Starting comparison test with ${prompts.length} prompts and ${testFiles.length} files`);
  console.log(`📊 Total tests: ${prompts.length * testFiles.length} (${runsPerTest} runs each)`);
  
  const results: TestResult[] = [];
  
  // Run tests for each prompt-file combination
  for (const promptConfig of prompts) {
    console.log(`\n🔬 Testing prompt: ${promptConfig.name}`);
    
    for (const testFile of testFiles) {
      console.log(`  📄 Testing file: ${testFile.name}`);
      
      // Use prompt-specific schema if provided, otherwise use base schema
      const schema = promptConfig.schema || baseSchema;
      
      // Run multiple times for this prompt-file combination
      const promises = Array.from({ length: runsPerTest }, () => {
        const runStartTime = Date.now();
        return extractDataFromMarkdown(
          testFile.markdown,
          'scope12',
          promptConfig.prompt,
          schema
        ).then(result => ({
          result,
          duration: Date.now() - runStartTime
        }));
      });
      
      const settledResults = await Promise.allSettled(promises);
      const runs = settledResults.map(r => 
        r.status === 'fulfilled' ? r.value.result : null
      );
      const timings = settledResults.map(r => 
        r.status === 'fulfilled' ? r.value.duration : null
      ).filter(t => t !== null) as number[];
      
      // Calculate metrics
      const validRuns = runs.filter(r => r !== null);
      const parsedRuns = validRuns.map(run => 
        typeof run === 'string' ? JSON.parse(run) : run
      );
      
      // Compare each run and collect diffs for failed runs
      const failures: Array<{ runIndex: number; diffs: JsonDiff[] }> = [];
      const correctRuns = parsedRuns.filter((run, index) => {
        const diffs = compareJson(testFile.expectedResult, run);
        if (diffs.length > 0) {
          failures.push({ runIndex: index, diffs });
          return false;
        }
        return true;
      });
      
      const accuracy = validRuns.length > 0 ? (correctRuns.length / validRuns.length) * 100 : 0;
      const successRate = runs.length > 0 ? (validRuns.length / runs.length) * 100 : 0;
      const avgResponseTime = timings.length > 0 ? timings.reduce((a, b) => a + b, 0) / timings.length : 0;
      
      const testResult: TestResult = {
        promptName: promptConfig.name,
        fileName: testFile.name,
        accuracy,
        avgResponseTime,
        successRate,
        runs: parsedRuns,
        timings,
        failures
      };
      
      results.push(testResult);
      
      console.log(`    ✅ ${testFile.name} - Accuracy: ${accuracy.toFixed(1)}%, Success: ${successRate.toFixed(1)}%`);
    }
  }
  
  // Generate comparison report
  const report = generateComparisonReport(results, config);
  
  // Save results
  const timestamp = new Date().toISOString();
  const filename = `comparison_test_${timestamp.replace(/[:.]/g, '-')}.json`;
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const filepath = join(__dirname, outputDir, filename);
  
  if (!existsSync(join(__dirname, outputDir))) {
    mkdirSync(join(__dirname, outputDir), { recursive: true });
  }
  
  writeFileSync(filepath, JSON.stringify(report, null, 2));
  console.log(`\n📁 Results saved to: ${filepath}`);
  
  return report;
};

const generateComparisonReport = (results: TestResult[], config: ComparisonTestConfig): ComparisonReport => {
  const { prompts, testFiles, runsPerTest } = config;
  
  // Prompt comparison
  const promptComparison: ComparisonReport['promptComparison'] = {};
  
  for (const promptConfig of prompts) {
    const promptResults = results.filter(r => r.promptName === promptConfig.name);
    const totalCorrect = promptResults.reduce((sum, r) => sum + (r.accuracy / 100 * runsPerTest), 0);
    const totalTests = promptResults.length * runsPerTest;
    const overallAccuracy = totalTests > 0 ? (totalCorrect / totalTests) * 100 : 0;
    const avgResponseTime = promptResults.reduce((sum, r) => sum + r.avgResponseTime, 0) / promptResults.length;
    const successRate = promptResults.reduce((sum, r) => sum + r.successRate, 0) / promptResults.length;
    
    // Find best and worst performing files
    const sortedByAccuracy = [...promptResults].sort((a, b) => b.accuracy - a.accuracy);
    const bestPerformingFiles = sortedByAccuracy.slice(0, 3).map(r => r.fileName);
    const worstPerformingFiles = sortedByAccuracy.slice(-3).map(r => r.fileName);
    
    promptComparison[promptConfig.name] = {
      overallAccuracy,
      avgResponseTime,
      successRate,
      bestPerformingFiles,
      worstPerformingFiles,
      totalCorrect: Math.round(totalCorrect),
      totalTests
    };
  }
  
  // File comparison
  const fileComparison: ComparisonReport['fileComparison'] = {};
  
  for (const testFile of testFiles) {
    const fileResults = results.filter(r => r.fileName === testFile.name);
    const promptRankings = fileResults
      .map(r => ({
        promptName: r.promptName,
        accuracy: r.accuracy,
        avgResponseTime: r.avgResponseTime
      }))
      .sort((a, b) => b.accuracy - a.accuracy);
    
    // Determine difficulty based on overall accuracy
    const avgAccuracy = promptRankings.reduce((sum, s) => sum + s.accuracy, 0) / promptRankings.length;
    const difficulty: 'easy' | 'medium' | 'hard' = 
      avgAccuracy >= 80 ? 'easy' : avgAccuracy >= 60 ? 'medium' : 'hard';
    
    fileComparison[testFile.name] = {
      promptRankings,
      difficulty
    };
  }
  
  return {
    timestamp: new Date().toISOString(),
    config: {
      totalTests: prompts.length * testFiles.length,
      runsPerTest,
      prompts: prompts.map(p => p.name),
      testFiles: testFiles.map(f => f.name)
    },
    promptComparison,
    fileComparison,
    detailedResults: results
  };
};

const printDiffSummary = (failures: Array<{ runIndex: number; diffs: JsonDiff[] }>, promptName: string, fileName: string) => {
  if (failures.length === 0) return;
  
  console.log(`\n🔍 Failure Analysis for ${promptName} on ${fileName}:`);
  
  // Group diffs by path to show patterns
  const diffsByPath: Record<string, JsonDiff[]> = {};
  failures.forEach(failure => {
    failure.diffs.forEach(diff => {
      if (!diffsByPath[diff.path]) {
        diffsByPath[diff.path] = [];
      }
      diffsByPath[diff.path].push(diff);
    });
  });
  
  // Show most common failure patterns
  const sortedPaths = Object.entries(diffsByPath)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5); // Top 5 most common issues
  
  sortedPaths.forEach(([path, diffs]) => {
    console.log(`  📍 ${path} (${diffs.length}/${failures.length} runs failed):`);
    
    // Show examples of the different types of failures for this path
    const examplesByType = diffs.reduce((acc, diff) => {
      if (!acc[diff.type]) {
        acc[diff.type] = diff;
      }
      return acc;
    }, {} as Record<string, JsonDiff>);
    
    Object.entries(examplesByType).forEach(([type, diff]) => {
      switch (type) {
        case 'missing':
          console.log(`     ❌ MISSING: Expected ${JSON.stringify(diff.expected)}, got undefined`);
          break;
        case 'extra':
          console.log(`     ➕ EXTRA: Got ${JSON.stringify(diff.actual)}, expected undefined`);
          break;
        case 'unexpected_value':
          console.log(`     🚫 UNEXPECTED VALUE: Expected null, got ${JSON.stringify(diff.actual)}`);
          break;
        case 'different':
          console.log(`     🔄 DIFFERENT: Expected ${JSON.stringify(diff.expected)}, got ${JSON.stringify(diff.actual)}`);
          break;
        case 'type_mismatch':
          console.log(`     ⚠️  TYPE: Expected ${typeof diff.expected}, got ${typeof diff.actual}`);
          break;
      }
    });
  });
};

export const printComparisonSummary = (report: ComparisonReport) => {
  console.log('\n🎯 PROMPT COMPARISON TEST SUMMARY');
  console.log('=' .repeat(50));
  
  // Prompt rankings
  const promptRankings = Object.entries(report.promptComparison)
    .sort((a, b) => b[1].overallAccuracy - a[1].overallAccuracy);
  
  console.log('\n📊 Prompt Performance Rankings:');
  promptRankings.forEach(([name, stats], index) => {
    console.log(`${index + 1}. ${name}`);
    console.log(`   Accuracy: ${stats.overallAccuracy.toFixed(1)}% (${stats.totalCorrect}/${stats.totalTests})`);
    console.log(`   Avg Response Time: ${stats.avgResponseTime.toFixed(0)}ms`);
    console.log(`   Success Rate: ${stats.successRate.toFixed(1)}%`);
    console.log(`   Best Files: ${stats.bestPerformingFiles.join(', ')}`);
    console.log(`   Worst Files: ${stats.worstPerformingFiles.join(', ')}`);
    console.log('');
  });
  
  // File difficulty analysis
  console.log('\n📄 Test File Difficulty Analysis:');
  const filesByDifficulty = Object.entries(report.fileComparison)
    .reduce((acc, [fileName, data]) => {
      acc[data.difficulty] = acc[data.difficulty] || [];
      acc[data.difficulty].push(fileName);
      return acc;
    }, {} as Record<string, string[]>);
  
  ['easy', 'medium', 'hard'].forEach(difficulty => {
    const files = filesByDifficulty[difficulty] || [];
    if (files.length > 0) {
      console.log(`${difficulty.toUpperCase()}: ${files.join(', ')}`);
    }
  });
  
  // Winner analysis
  console.log('\n🏆 Winner Analysis:');
  const winnerCounts = Object.values(report.fileComparison).reduce((acc, fileData) => {
    const topRanking = fileData.promptRankings[0];
    const secondRanking = fileData.promptRankings[1];
    
    // Only count as winner if they actually have > 0% accuracy
    // and are clearly better than second place (or second place doesn't exist)
    if (topRanking && topRanking.accuracy > 0) {
      if (!secondRanking || topRanking.accuracy > secondRanking.accuracy) {
        acc[topRanking.promptName] = (acc[topRanking.promptName] || 0) + 1;
      }
    }
    
    return acc;
  }, {} as Record<string, number>);
  
  if (Object.keys(winnerCounts).length === 0) {
    console.log('No clear winners - all variations performed equally (poorly)');
  } else {
    Object.entries(winnerCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([prompt, wins]) => {
        console.log(`${prompt}: ${wins} file wins`);
      });
  }
  
  // Show detailed failure analysis for each prompt/file combination
  console.log('\n📊 Detailed Failure Analysis:');
  const failedResults = report.detailedResults.filter(result => result.failures.length > 0);
  
  failedResults.forEach((result, index) => {
    if (index > 0) {
      console.log('\n' + '='.repeat(60));
    }
    printDiffSummary(result.failures, result.promptName, result.fileName);
  });
};