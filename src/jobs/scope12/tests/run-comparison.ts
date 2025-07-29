import { runComparisonTest, printComparisonSummary } from "./comparison-test"
import { newSchema } from "./data"
import { expectedResults, testFileMapping } from "./expected-results"
import { prompt as basePrompt } from "../prompt"
import { readFileSync, existsSync, readdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

import { testVariations } from "./test-variations"

// Set this to an array of years to check, e.g. [2024], or leave empty to check all years
const yearsToCheck: number[] = [2024];

// Set this to specific fileNames to only test those files, or leave empty to test all files
const fileNamesToCheck: string[] = ["rise"];

// Auto-load all markdown files from input directory
const loadTestFiles = () => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const inputDir = join(__dirname, 'input');
  
  if (!existsSync(inputDir)) {
    console.error(`Input directory does not exist: ${inputDir}`);
    return [];
  }
  
  const files = readdirSync(inputDir);
  const testFiles: { name:
  string; markdown: string; expectedResult: any }[] = [];
  
  for (const file of files) {
    if (file.endsWith('.md') || file.endsWith('.txt')) {
      const baseName = file.replace(/\.(md|txt)$/, '');
      
      // Skip this file if fileNamesToCheck is set and doesn't include this file
      if (fileNamesToCheck.length > 0 && !fileNamesToCheck.includes(baseName)) {
        continue;
      }
      
      const markdownPath = join(inputDir, file);
      
      try {
        const markdown = readFileSync(markdownPath, 'utf-8');
        
        // Get expected result from mapping or use default
        const expectedResultKey = testFileMapping[baseName] || 'default';
        let expectedResult = expectedResults[expectedResultKey];
        
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
  
  return testFiles;
};

const runComparison = async () => {
  console.log("🚀 Starting prompt comparison test...");
  
  if (fileNamesToCheck.length > 0) {
    console.log(`🎯 Testing only files: ${fileNamesToCheck.join(', ')}`);
  }
  if (yearsToCheck.length > 0) {
    console.log(`📅 Testing only years: ${yearsToCheck.join(', ')}`);
  }
  
  const testFiles = loadTestFiles();
  
  if (testFiles.length === 0) {
    console.error("❌ No test files found. Please add .md/.txt files with corresponding .expected.json files to the input/ directory");
    return;
  }
  
  const config = {
    prompts: testVariations,
    testFiles: testFiles,
    baseSchema: newSchema,
    runsPerTest: 1, // Run each combination x times
    outputDir: "comparison_results",
    yearsToCheck: yearsToCheck, // Pass year filter to comparison test
    fileNamesToCheck: fileNamesToCheck // Pass fileName filter for logging purposes
  };
  
  const report = await runComparisonTest(config);
  
  // Print summary
  printComparisonSummary(report, config);
  
  console.log("\n🎉 Comparison test completed!");
  console.log(`📊 Total tests run: ${config.prompts.length * config.testFiles.length * config.runsPerTest}`);
  console.log(`\n💡 To modify test variations, edit: test-variations.ts`);
};

runComparison().catch(console.error);