import { runComparisonTest, printComparisonSummary } from "./comparison-test"
import { newSchema } from "./data"
import { expectedResults, testFileMapping } from "./expected-results"
import { prompt as basePrompt } from "../prompt"
import { readFileSync, existsSync, readdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

import { testVariations } from "./test-variations"

// Auto-load all markdown files from input directory
const loadTestFiles = () => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const inputDir = join(__dirname, 'input');
  
  if (!existsSync(inputDir)) {
    console.error(`Input directory does not exist: ${inputDir}`);
    return [];
  }
  
  const files = readdirSync(inputDir);
  const testFiles: { name: string; markdown: string; expectedResult: any }[] = [];
  
  for (const file of files) {
    if (file.endsWith('.md') || file.endsWith('.txt')) {
      const baseName = file.replace(/\.(md|txt)$/, '');
      const markdownPath = join(inputDir, file);
      
      try {
        const markdown = readFileSync(markdownPath, 'utf-8');
        
        // Get expected result from mapping or use default
        const expectedResultKey = testFileMapping[baseName] || 'default';
        let expectedResult = expectedResults[expectedResultKey];
        
        if (!expectedResult) {
          console.warn(`⚠️  No expected result found for ${baseName} (key: ${expectedResultKey}), using default`);
          expectedResult = expectedResults.default;
        }
        
        testFiles.push({
          name: baseName,
          markdown,
          expectedResult
        });
        
        console.log(`✅ Loaded test file: ${baseName} (expected: ${expectedResultKey})`);
      } catch (error) {
        console.error(`❌ Error loading ${file}:`, error);
      }
    }
  }
  
  return testFiles;
};

const runComparison = async () => {
  console.log("🚀 Starting prompt comparison test...");
  
  const testFiles = loadTestFiles();
  
  if (testFiles.length === 0) {
    console.error("❌ No test files found. Please add .md/.txt files with corresponding .expected.json files to the input/ directory");
    return;
  }
  
  const config = {
    prompts: testVariations,
    testFiles: testFiles,
    baseSchema: newSchema,
    runsPerTest: 1, // Run each combination 10 times
    outputDir: "comparison_results"
  };
  
  const report = await runComparisonTest(config);
  
  // Print summary
  printComparisonSummary(report);
  
  console.log("\n🎉 Comparison test completed!");
  console.log(`📊 Total tests run: ${config.prompts.length * config.testFiles.length * config.runsPerTest}`);
  console.log(`\n💡 To modify test variations, edit: test-variations.ts`);
};

runComparison().catch(console.error);