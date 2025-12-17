import 'dotenv/config';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { Company, Diff, DiffReport } from './comparing-staging-production';

const EVALUATION_FILE_PATH = 'PATH_TO_EVALUATION_FILE';


interface AccuracyMetrics {
  correct: number;
  total: number;
  accuracy: number;
}

interface ScopeAccuracyResults {
  scope1: AccuracyMetrics;
  scope2: AccuracyMetrics;
  scope1And2: AccuracyMetrics;
  scope3: AccuracyMetrics;
  totals: AccuracyMetrics;
  overall: AccuracyMetrics;
}

/**
 * Reads the evaluation JSON file and parses it
 */
async function loadEvaluationFile(filePath: string): Promise<Company[]> {
  const fileContent = await readFile(filePath, 'utf-8');
  return JSON.parse(fileContent);
}

/**
 * Checks if a Diff object has matching production and staging values
 * Uses floating-point tolerance of 0.01 to match frontend calculation
 * Matches frontend: both must be non-null (after getNum normalization)
 */
function isDiffCorrect(diff: Diff | undefined): boolean {
  if (!diff) return false;
  // Match frontend: both must be non-null (getNum converts null/undefined to null)
  const prodVal = diff.productionValue;
  const stagingVal = diff.stagingValue;
  if (prodVal === null || prodVal === undefined || stagingVal === null || stagingVal === undefined) {
    return false;
  }
  // Use floating-point tolerance to match frontend behavior
  return Math.abs(prodVal - stagingVal) < 1.0;
}

/**
 * Checks if a Diff object has at least one value (production or staging)
 * We skip fields where both are undefined/null
 * Matches frontend: checks for null (after getNum normalization) or undefined
 */
function hasAnyValue(diff: Diff | undefined): boolean {
  if (!diff) return false;
  // Match frontend: count if either is not null/undefined (getNum converts both to null)
  const hasProd = diff.productionValue !== undefined && diff.productionValue !== null;
  const hasStaging = diff.stagingValue !== undefined && diff.stagingValue !== null;
  return hasProd || hasStaging;
}

/**
 * Helper to check if a report is for 2024 (matches frontend filtering)
 */
function is2024Report(report: DiffReport): boolean {
  const startDate = typeof report.reportingPeriod.startDate === 'string' 
    ? report.reportingPeriod.startDate 
    : report.reportingPeriod.startDate.toISOString();
  return startDate === "2024-01-01T00:00:00.000Z";
}

/**
 * Extracts scope1 Diff objects from all companies and reports
 * Filters to 2024 reports only to match frontend behavior
 */
function extractScope1Diffs(companies: Company[]): Diff[] {
  const diffs: Diff[] = [];
  
  for (const company of companies) {
    for (const report of company.diffReports) {
      // Filter to 2024 reports only (matches frontend)
      if (!is2024Report(report)) continue;
      
      // Extract scope1
      if (report.diffs.emissions.scope1) {
        diffs.push(report.diffs.emissions.scope1);
      }
    }
  }
  
  return diffs;
}

/**
 * Extracts scope2 Diff objects (lb, mb, unknown) from all companies and reports
 * Filters to 2024 reports only to match frontend behavior
 */
function extractScope2Diffs(companies: Company[]): Diff[] {
  const diffs: Diff[] = [];
  
  for (const company of companies) {
    for (const report of company.diffReports) {
      // Filter to 2024 reports only (matches frontend)
      if (!is2024Report(report)) continue;
      
      // Extract scope2 values (lb, mb, unknown) - include even if undefined to match filtering logic
      diffs.push(report.diffs.emissions.scope2.lb);
      diffs.push(report.diffs.emissions.scope2.mb);
      diffs.push(report.diffs.emissions.scope2.unknown);
    }
  }
  
  return diffs;
}

/**
 * Extracts all scope1 and scope2 Diff objects including the combined scope1And2 field
 * Includes: scope1, scope2.lb, scope2.mb, scope2.unknown, scope1And2
 * This matches the frontend's scope1And2Accuracy calculation which includes all individual
 * values AND the combined field (if available)
 * Filters to 2024 reports only to match frontend behavior
 */
function extractScope1And2Diffs(companies: Company[]): Diff[] {
  const diffs: Diff[] = [];
  
  for (const company of companies) {
    for (const report of company.diffReports) {
      // Filter to 2024 reports only (matches frontend)
      if (!is2024Report(report)) continue;
      
      // Extract scope1
      if (report.diffs.emissions.scope1) {
        diffs.push(report.diffs.emissions.scope1);
      }
      
      // Extract scope2 values (lb, mb, unknown) - include even if undefined to match filtering logic
      diffs.push(report.diffs.emissions.scope2.lb);
      diffs.push(report.diffs.emissions.scope2.mb);
      diffs.push(report.diffs.emissions.scope2.unknown);
      
      // Extract scope1And2 (combined value) - frontend includes this if available
      if (report.diffs.emissions.scope1And2) {
        diffs.push(report.diffs.emissions.scope1And2);
      }
    }
  }
  
  return diffs;
}

/**
 * Extracts all individual scope3 category Diff objects from all companies and reports
 * Each category (1-16) is compared individually
 * Also includes scope3StatedTotalEmissions (exists in data but not in TypeScript interface)
 * Filters to 2024 reports only to match frontend behavior
 */
function extractScope3Diffs(companies: Company[]): Diff[] {
  const diffs: Diff[] = [];
  
  for (const company of companies) {
    for (const report of company.diffReports) {
      // Filter to 2024 reports only (matches frontend)
      if (!is2024Report(report)) continue;
      
      // Extract individual scope3 categories
      for (const scope3Category of report.diffs.emissions.scope3) {
        if (scope3Category.value) {
          diffs.push(scope3Category.value);
        }
      }
      
      // Extract scope3StatedTotalEmissions (exists in JSON data but not in TypeScript interface)
      // This matches the frontend's behavior of including scope3StatedTotalEmissions separately
      const scope3StatedTotal = (report.diffs.emissions as any).scope3StatedTotalEmissions;
      if (scope3StatedTotal) {
        diffs.push(scope3StatedTotal);
      }
    }
  }
  
  return diffs;
}

/**
 * Extracts all statedTotalEmissions Diff objects from all companies and reports
 * Filters to 2024 reports only to match frontend behavior
 */
function extractTotalEmissionsDiffs(companies: Company[]): Diff[] {
  const diffs: Diff[] = [];
  
  for (const company of companies) {
    for (const report of company.diffReports) {
      // Filter to 2024 reports only (matches frontend)
      if (!is2024Report(report)) continue;
      
      const totalDiff = report.diffs.emissions.statedTotalEmissions;
      if (totalDiff) {
        diffs.push(totalDiff);
      }
    }
  }
  
  return diffs;
}

/**
 * Calculates accuracy metrics for a collection of Diff objects
 * Counts fields where at least one side (production or staging) has a value
 * Skips fields where both are undefined/null
 */
function calculateAccuracy(diffs: Diff[], label?: string): AccuracyMetrics {
  // Count diffs where at least one side has a value
  const diffsWithAnyValue = diffs.filter(hasAnyValue);
  const correct = diffsWithAnyValue.filter(isDiffCorrect).length;
  const total = diffsWithAnyValue.length;
  const accuracy = total > 0 ? correct / total : 0;
  
  if (label === 'scope2') {
    console.log(`\n🔍 SCOPE2 DEBUG in calculate-scope-accuracy:`);
    console.log(`📊 Total scope2 diffs extracted: ${diffs.length}`);
    console.log(`✅ Diffs with any value: ${total}`);
    
    // Count different types
    let prodOnly = 0, stagingOnly = 0, both = 0, neither = 0;
    diffs.forEach(diff => {
      if (!diff) return;
      const hasProd = diff.productionValue !== undefined && diff.productionValue !== null;
      const hasStaging = diff.stagingValue !== undefined && diff.stagingValue !== null;
      
      if (hasProd && hasStaging) both++;
      else if (hasProd) prodOnly++;
      else if (hasStaging) stagingOnly++;
      else neither++;
    });
    
    console.log(`🔢 Breakdown: ${both} both values, ${prodOnly} prod only, ${stagingOnly} staging only, ${neither} neither`);
  }
  
  return {
    correct,
    total,
    accuracy
  };
}

/**
 * Calculates accuracy metrics for scope1, scope2, scope1And2, scope3, totals, and overall
 * Note: scope1And2 includes all individual scope1 and scope2 values PLUS the combined scope1And2 field (if available)
 * This matches the frontend's behavior which includes both individual values and the combined field
 */
function calculateScopeAccuracies(companies: Company[]): ScopeAccuracyResults {
  const scope1Diffs = extractScope1Diffs(companies);
  const scope2Diffs = extractScope2Diffs(companies);
  const scope1And2Diffs = extractScope1And2Diffs(companies);
  const scope3Diffs = extractScope3Diffs(companies);
  const totalDiffs = extractTotalEmissionsDiffs(companies);
  
  const scope1Metrics = calculateAccuracy(scope1Diffs);
  const scope2Metrics = calculateAccuracy(scope2Diffs, 'scope2');
  const scope1And2Metrics = calculateAccuracy(scope1And2Diffs);
  const scope3Metrics = calculateAccuracy(scope3Diffs);
  const totalsMetrics = calculateAccuracy(totalDiffs);
  
  // Overall combines scope1And2, scope3, and totals
  const allDiffs = [...scope1And2Diffs, ...scope3Diffs, ...totalDiffs];
  const overallMetrics = calculateAccuracy(allDiffs);
  
  return {
    scope1: scope1Metrics,
    scope2: scope2Metrics,
    scope1And2: scope1And2Metrics,
    scope3: scope3Metrics,
    totals: totalsMetrics,
    overall: overallMetrics
  };
}

/**
 * Formats accuracy metrics for display
 */
function formatAccuracyMetrics(metrics: AccuracyMetrics, label: string): string {
  const percentage = (metrics.accuracy * 100).toFixed(2);
  return `${label}:\n  Correct: ${metrics.correct} out of ${metrics.total}\n  Accuracy: ${percentage}%\n`;
}

/**
 * Displays the accuracy results
 */
function displayResults(results: ScopeAccuracyResults): void {
  console.log('\n📊 Accuracy Metrics by Scope\n');
  console.log(formatAccuracyMetrics(results.scope1, 'Scope 1'));
  console.log(formatAccuracyMetrics(results.scope2, 'Scope 2'));
  console.log(formatAccuracyMetrics(results.scope1And2, 'Scope 1 & 2 Combined (includes individual + combined field)'));
  console.log(formatAccuracyMetrics(results.scope3, 'Scope 3'));
  console.log(formatAccuracyMetrics(results.totals, 'Total Emissions'));
  console.log(formatAccuracyMetrics(results.overall, 'Overall (Scope 1&2 + Scope 3 + Totals)'));
}

/**
 * Main function to run the accuracy calculation
 */
async function main() {
  try {
    // Allow override via command line argument, otherwise use the default
    const filePath = process.argv[2] || EVALUATION_FILE_PATH;
    const resolvedPath = resolve(filePath);
    
    console.log(`📖 Loading evaluation file: ${resolvedPath}`);
    
    const companies = await loadEvaluationFile(resolvedPath);
    console.log(`✅ Loaded ${companies.length} companies`);
    
    const results = calculateScopeAccuracies(companies);
    displayResults(results);
    
  } catch (error) {
    console.error('❌ Error calculating accuracy:', error);
    process.exit(1);
  }
}

// Execute the main function
main();

