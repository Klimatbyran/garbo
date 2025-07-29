import { readFileSync, readdirSync, existsSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url));
const resultsDir = join(__dirname, 'comparison_results');

// Configuration - specify the hashes you want to analyze
const TARGET_PROMPT_HASH = "bbf507516a060b5c";  // Change this to your desired prompt hash
const TARGET_SCHEMA_HASH = "21972b07d7e48a75";  // Change this to your desired schema hash

// Load hash mappings to show what these hashes represent
const loadHashMappings = () => {
  const hashMappingsFile = join(resultsDir, 'hashMappings.json');
  if (existsSync(hashMappingsFile)) {
    try {
      return JSON.parse(readFileSync(hashMappingsFile, 'utf-8'));
    } catch (error) {
      console.warn('Could not load hash mappings:', error.message);
      return { prompts: {}, schemas: {} };
    }
  }
  return { prompts: {}, schemas: {} };
};

// Load all comparison result files
const loadAllResults = () => {
  if (!existsSync(resultsDir)) {
    console.error(`Results directory does not exist: ${resultsDir}`);
    return [];
  }

  const files = readdirSync(resultsDir);
  const resultFiles = files.filter(f => f.startsWith('comparison_test_') && f.endsWith('.json'));
  
  console.log(`Found ${resultFiles.length} result files`);
  
  const allResults = [];
  
  for (const file of resultFiles) {
    try {
      const filePath = join(resultsDir, file);
      const data = JSON.parse(readFileSync(filePath, 'utf-8'));
      
      // Extract matching results
      const matchingResults = data.detailedResults?.filter(result => 
        result.promptHash === TARGET_PROMPT_HASH && 
        result.schemaHash === TARGET_SCHEMA_HASH
      ) || [];
      
      if (matchingResults.length > 0) {
        console.log(`📁 ${file}: Found ${matchingResults.length} matching results`);
        allResults.push(...matchingResults.map(r => ({
          ...r,
          sourceFile: file,
          timestamp: data.timestamp
        })));
      }
    } catch (error) {
      console.warn(`Could not parse ${file}:`, error.message);
    }
  }
  
  return allResults;
};

// Calculate aggregate statistics
const calculateAggregateStats = (results) => {
  if (results.length === 0) {
    return null;
  }

  // Group by file name to get per-file statistics
  const byFile = {};
  results.forEach(result => {
    if (!byFile[result.fileName]) {
      byFile[result.fileName] = [];
    }
    byFile[result.fileName].push(result);
  });

  // Calculate overall statistics
  const totalTests = results.reduce((sum, r) => sum + r.runs.length, 0);
  const totalCorrect = results.reduce((sum, r) => sum + (r.accuracy / 100 * r.runs.length), 0);
  const overallAccuracy = totalTests > 0 ? (totalCorrect / totalTests) * 100 : 0;
  
  const avgResponseTime = results.reduce((sum, r) => sum + r.avgResponseTime, 0) / results.length;
  const avgSuccessRate = results.reduce((sum, r) => sum + r.successRate, 0) / results.length;

  // Per-file breakdown
  const fileStats = Object.entries(byFile).map(([fileName, fileResults]) => {
    const fileTests = fileResults.reduce((sum, r) => sum + r.runs.length, 0);
    const fileCorrect = fileResults.reduce((sum, r) => sum + (r.accuracy / 100 * r.runs.length), 0);
    const fileAccuracy = fileTests > 0 ? (fileCorrect / fileTests) * 100 : 0;
    const fileAvgTime = fileResults.reduce((sum, r) => sum + r.avgResponseTime, 0) / fileResults.length;
    
    return {
      fileName,
      runs: fileTests,
      accuracy: fileAccuracy,
      avgResponseTime: fileAvgTime,
      testSessions: fileResults.length
    };
  }).sort((a, b) => b.accuracy - a.accuracy);

  // Timeline analysis
  const timeline = results.map(r => ({
    timestamp: r.timestamp,
    fileName: r.fileName,
    accuracy: r.accuracy,
    sourceFile: r.sourceFile
  })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return {
    overview: {
      totalTestSessions: results.length,
      totalRuns: totalTests,
      overallAccuracy: overallAccuracy,
      avgResponseTime: avgResponseTime,
      avgSuccessRate: avgSuccessRate
    },
    fileBreakdown: fileStats,
    timeline: timeline
  };
};

// Main analysis function
const analyzeResults = () => {
  console.log('🔍 PROMPT/SCHEMA ANALYSIS');
  console.log('=' .repeat(50));
  console.log(`Target Prompt Hash: ${TARGET_PROMPT_HASH}`);
  console.log(`Target Schema Hash: ${TARGET_SCHEMA_HASH}`);
  
  // Load hash mappings to show what we're analyzing
  const hashMappings = loadHashMappings();
  if (hashMappings.prompts[TARGET_PROMPT_HASH]) {
    console.log(`\n📝 Prompt Preview: ${hashMappings.prompts[TARGET_PROMPT_HASH].substring(0, 100)}...`);
  }
  if (hashMappings.schemas[TARGET_SCHEMA_HASH]) {
    console.log(`\n📋 Schema Type: ${hashMappings.schemas[TARGET_SCHEMA_HASH].type || 'Unknown'}`);
  }
  
  console.log('\n🔍 Loading results...');
  const results = loadAllResults();
  
  if (results.length === 0) {
    console.log('❌ No matching results found for the specified prompt/schema combination.');
    console.log('\n💡 Available hashes in results:');
    
    // Show available hashes from all result files
    const availableHashes = new Set();
    const files = readdirSync(resultsDir);
    const resultFiles = files.filter(f => f.startsWith('comparison_test_') && f.endsWith('.json'));
    
    for (const file of resultFiles.slice(0, 5)) { // Check first 5 files to avoid spam
      try {
        const filePath = join(resultsDir, file);
        const data = JSON.parse(readFileSync(filePath, 'utf-8'));
        
        data.detailedResults?.forEach(result => {
          if (result.promptHash && result.schemaHash) {
            availableHashes.add(`Prompt: ${result.promptHash}, Schema: ${result.schemaHash} (${result.promptName})`);
          }
        });
      } catch (error) {
        // Skip files with errors
      }
    }
    
    console.log('Found these combinations in recent results:');
    Array.from(availableHashes).slice(0, 10).forEach(hash => {
      console.log(`  ${hash}`);
    });
    
    return;
  }

  console.log(`\n✅ Found ${results.length} test sessions matching the criteria`);
  
  const stats = calculateAggregateStats(results);
  
  console.log('\n📊 AGGREGATE STATISTICS');
  console.log('=' .repeat(30));
  console.log(`Total Test Sessions: ${stats.overview.totalTestSessions}`);
  console.log(`Total Runs: ${stats.overview.totalRuns}`);
  console.log(`Overall Accuracy: ${stats.overview.overallAccuracy.toFixed(1)}%`);
  console.log(`Avg Response Time: ${stats.overview.avgResponseTime.toFixed(0)}ms`);
  console.log(`Avg Success Rate: ${stats.overview.avgSuccessRate.toFixed(1)}%`);
  
  console.log('\n📄 PER-FILE BREAKDOWN');
  console.log('=' .repeat(30));
  stats.fileBreakdown.forEach((file, index) => {
    console.log(`${index + 1}. ${file.fileName}`);
    console.log(`   Accuracy: ${file.accuracy.toFixed(1)}% (${file.runs} runs across ${file.testSessions} sessions)`);
    console.log(`   Avg Response Time: ${file.avgResponseTime.toFixed(0)}ms`);
  });
  
  console.log('\n📈 TIMELINE');
  console.log('=' .repeat(30));
  stats.timeline.forEach(entry => {
    const date = new Date(entry.timestamp).toLocaleString();
    console.log(`${date} | ${entry.fileName} | ${entry.accuracy.toFixed(1)}% | ${entry.sourceFile}`);
  });
};

// Run the analysis
analyzeResults();