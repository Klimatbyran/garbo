import { runComparisonTest, printComparisonSummary } from "./comparison-test"
import { readFileSync, existsSync, readdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { z } from "zod"

// Interface that each test suite must implement
export interface TestSuite {
  expectedResults: {
    [key: string]: any;
  };
  testFileMapping?: {
    [fileName: string]: string;
  }; // Optional - if not provided, file names are used as keys
  testVariations: Array<{
    name: string;
    prompt: string;
    schema: z.ZodSchema;
    baseline?: boolean;
  }>;
}

// Dynamic loader for test suites
const loadTestSuite = async (suiteName: string): Promise<TestSuite> => {
  try {
    const testsPath = `../${suiteName}/tests`;
    
    // Load the single test-suite.ts file
    const testSuiteModule = await import(`${testsPath}/test-suite`);
    
    return testSuiteModule.testSuite;
  } catch (error) {
    throw new Error(`Failed to load test suite '${suiteName}': ${error}`);
  }
};

// Auto-load all markdown files from input directory
const loadTestFiles = (suiteName: string, testSuite: TestSuite, yearsToCheck: number[], fileNamesToCheck: string[]) => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const inputDir = join(__dirname, '..', suiteName, 'tests', 'input');
  
  if (!existsSync(inputDir)) {
    console.error(`Input directory does not exist: ${inputDir}`);
    return [];
  }
  
  const files = readdirSync(inputDir);
  const testFiles: { name: string; markdown: string; expectedResult: any }[] = [];
  
  console.log(`🔍 Found ${files.length} files in input directory`);
  console.log(`🎯 Looking for files: ${fileNamesToCheck.length > 0 ? fileNamesToCheck.join(', ') : 'ALL FILES'}`);
  
  for (const file of files) {
    if (file.endsWith('.md') || file.endsWith('.txt')) {
      const baseName = file.replace(/\.(md|txt)$/, '');
      
      console.log(`📄 Processing file: ${baseName}`);
      
      // Skip this file if fileNamesToCheck is set and doesn't include this file
      if (fileNamesToCheck.length > 0 && !fileNamesToCheck.includes(baseName)) {
        console.log(`⏭️  Skipping ${baseName} (not in specified files)`);
        continue;
      }
      
      const markdownPath = join(inputDir, file);
      
      try {
        const markdown = readFileSync(markdownPath, 'utf-8');
        
        // Get expected result from mapping or use file name as key
        const expectedResultKey = testSuite.testFileMapping?.[baseName] || baseName;
        let expectedResult = testSuite.expectedResults[expectedResultKey];
        
        if (!expectedResult) {
          console.warn(`⚠️  No expected result found for ${baseName} (key: ${expectedResultKey}), using default`);
          throw new Error(`No expected result found for ${baseName} (key: ${expectedResultKey})`);
        }
        
        // If yearsToCheck is set, filter the expectedResult.scope12 array
        let filteredExpectedResult = expectedResult;
        if (yearsToCheck.length > 0 && expectedResult && Array.isArray(expectedResult.scope12)) {
          filteredExpectedResult = {
            ...expectedResult,
            scope12: expectedResult.scope12.filter((item: any) => yearsToCheck.includes(item.year))
          };
        }
        
        testFiles.push({
          name: baseName,
          markdown,
          expectedResult: filteredExpectedResult
        });
        
        console.log(`✅ Loaded test file: ${baseName} (expected: ${expectedResultKey})`);
        console.log("Expected result for", baseName, ":", JSON.stringify(filteredExpectedResult, null, 2));

      } catch (error) {
        console.error(`❌ Error loading ${file}:`, error);
      }
    }
  }
  
  console.log(`✅ Loaded ${testFiles.length} test files: ${testFiles.map(f => f.name).join(', ')}`);
  return testFiles;
};

const runGenericComparison = async (suiteName: string, options: {
  yearsToCheck?: number[];
  fileNamesToCheck?: string[];
  runsPerTest?: number;
}) => {
  console.log(`🚀 Starting prompt comparison test for suite: ${suiteName}...`);
  
  const { yearsToCheck = [], fileNamesToCheck = [], runsPerTest = 1 } = options;
  
  if (fileNamesToCheck.length > 0) {
    console.log(`🎯 Testing only files: ${fileNamesToCheck.join(', ')}`);
  }
  if (yearsToCheck.length > 0) {
    console.log(`📅 Testing only years: ${yearsToCheck.join(', ')}`);
  }
  
  // Load the test suite
  const testSuite = await loadTestSuite(suiteName);
  const testFiles = loadTestFiles(suiteName, testSuite, yearsToCheck, fileNamesToCheck);
  
  if (testFiles.length === 0) {
    console.error("❌ No test files found. Please add .md/.txt files with corresponding expected results to the input/ directory");
    return;
  }
  
  const config = {
    prompts: testSuite.testVariations,
    testFiles: testFiles,
    baseSchema: testSuite.testVariations[0].schema, // Use schema from first test variation
    runsPerTest: runsPerTest,
    outputDir: `../${suiteName}/tests/comparison_results`,
    yearsToCheck: yearsToCheck,
    fileNamesToCheck: fileNamesToCheck
  };
  
  const report = await runComparisonTest(config);
  
  // Print summary
  printComparisonSummary(report, config);
  
  console.log("\n🎉 Comparison test completed!");
  console.log(`📊 Total tests run: ${config.prompts.length * config.testFiles.length * config.runsPerTest}`);
  console.log(`\n💡 To modify test variations, edit: ${suiteName}/test-variations.ts`);
};

// CLI interface
const main = async () => {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error("Usage: npm run test:comparison <suite-name> [options]");
    console.error("Example: npm run test:comparison scope12 --years 2024 --files rise,catena");
    process.exit(1);
  }
  
  const suiteName = args[0];
  
  // Parse options
  const options: {
    yearsToCheck?: number[];
    fileNamesToCheck?: string[];
    runsPerTest?: number;
  } = {};
  
  console.log(`🔧 Parsing CLI arguments: ${args.join(' ')}`);
  
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--years') {
      const years = args[i + 1]?.split(',').map(y => parseInt(y.trim()));
      if (years && years.every(y => !isNaN(y))) {
        options.yearsToCheck = years;
        console.log(`📅 Parsed years: ${years.join(', ')}`);
      }
      i++; // Skip next argument
    } else if (arg === '--files') {
      const files = args[i + 1]?.split(',').map(f => f.trim());
      if (files) {
        options.fileNamesToCheck = files;
        console.log(`📁 Parsed files: ${files.join(', ')}`);
      }
      i++; // Skip next argument
    } else if (arg === '--runs') {
      const runs = parseInt(args[i + 1]);
      if (!isNaN(runs)) {
        options.runsPerTest = runs;
        console.log(`🔄 Parsed runs: ${runs}`);
      }
      i++; // Skip next argument
    }
  }
  
  try {
    await runGenericComparison(suiteName, options);
  } catch (error) {
    console.error(`❌ Error running comparison test:`, error);
    process.exit(1);
  }
};

// Export for programmatic use
export { runGenericComparison, loadTestSuite };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
} 