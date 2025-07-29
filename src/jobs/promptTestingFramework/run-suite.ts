#!/usr/bin/env node

import { runGenericComparison } from "./generic-run-comparison"

const main = async () => {
  const args = process.argv.slice(2);
  
  console.log(`🔧 run-suite.ts received arguments: ${args.join(' ')}`);
  
  if (args.length === 0) {
    console.error("Usage: node run-suite.js <suite-name> [options]");
    console.error("Example: node run-suite.js scope12 --years 2024 --files rise,catena");
    process.exit(1);
  }
  
  const suiteName = args[0];
  
  // Parse options
  const options: {
    yearsToCheck?: number[];
    fileNamesToCheck?: string[];
    runsPerTest?: number;
  } = {};
  
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--years') {
      const years = args[i + 1]?.split(',').map(y => parseInt(y.trim()));
      if (years && years.every(y => !isNaN(y))) {
        options.yearsToCheck = years;
      }
      i++; // Skip next argument
    } else if (arg === '--files') {
      const files = args[i + 1]?.split(',').map(f => f.trim());
      if (files) {
        options.fileNamesToCheck = files;
      }
      i++; // Skip next argument
    } else if (arg === '--runs') {
      const runs = parseInt(args[i + 1]);
      if (!isNaN(runs)) {
        options.runsPerTest = runs;
      }
      i++; // Skip next argument
    }
  }
  
  console.log(`📤 run-suite.ts calling runGenericComparison with options:`, options);
  
  try {
    await runGenericComparison(suiteName, options);
  } catch (error) {
    console.error(`❌ Error running comparison test:`, error);
    process.exit(1);
  }
};

main().catch(console.error); 