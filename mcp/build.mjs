#!/usr/bin/env node
/**
 * Build script for MCP server
 * Compiles TypeScript to JavaScript
 */

import { execSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'

const __dirname = new URL('.', import.meta.url).pathname

console.log('🔨 Building MCP server...')

// Create dist directory if it doesn't exist
const distDir = join(__dirname, 'dist')
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true })
}

try {
  // Build TypeScript
  execSync('npx tsc', {
    cwd: __dirname,
    stdio: 'inherit',
  })

  console.log('✅ MCP server built successfully!')
  console.log('📦 Output: dist/')
} catch (error) {
  console.error('❌ Build failed:', error)
  process.exit(1)
}
