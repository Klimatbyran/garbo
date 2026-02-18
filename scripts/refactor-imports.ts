#!/usr/bin/env node
/**
 * Refactor imports script using ts-morph
 *
 * Replaces @/ aliases with workspace package imports
 * Example: @/lib/openai → @garbo/shared/lib/openai
 */

import { Project, SyntaxKind } from 'ts-morph'

const project = new Project({
  tsConfigFilePath: './tsconfig.json',
  skipAddingFilesFromTsConfig: true,
})

// Import mapping rules
const importMappings = {
  // @/lib/* → @garbo/shared/lib/*
  '@/lib/': '@garbo/shared/lib/',
  '@/config/': '@garbo/shared/config/',
  '@/prompts/': '@garbo/shared/prompts/',
  '@/jobs/': '@garbo/jobs/',
  '@/api/': '@garbo/api/src/',
  '@/workers/': '@garbo/workers/src/',
  '@/discord/': '@garbo/shared/src/discord/',
  '@/services/': '@garbo/api/src/services/',
  '@/routes/': '@garbo/api/src/routes/',
  '@/plugins/': '@garbo/api/src/plugins/',
}

// Package-specific mappings (for files in specific packages)
const packageMappings = {
  'packages/shared': {
    '@/lib/': './lib/',
    '@/config/': './config/',
    '@/prompts/': './prompts/',
  },
  'packages/jobs': {
    '@/lib/': '@garbo/shared/lib/',
    '@/config/': '@garbo/shared/config/',
    '@/prompts/': '@garbo/shared/prompts/',
    '@/jobs/': './',
  },
  'packages/workers': {
    '@/lib/': '@garbo/shared/lib/',
    '@/config/': '@garbo/shared/config/',
    '@/prompts/': '@garbo/shared/prompts/',
    '@/jobs/': '@garbo/jobs/',
  },
  'packages/api': {
    '@/lib/': '@garbo/shared/lib/',
    '@/config/': '@garbo/shared/config/',
    '@/prompts/': '@garbo/shared/prompts/',
    '@/jobs/': '@garbo/jobs/',
    '@/services/': './services/',
    '@/routes/': './routes/',
    '@/plugins/': './plugins/',
  },
  'packages/mcp': {
    '@/lib/': '@garbo/shared/lib/',
    '@/config/': '@garbo/shared/config/',
    '@/prompts/': '@garbo/shared/prompts/',
    '@/jobs/': '@garbo/jobs/',
  },
}

function getImportPath(importPath, packagePath) {
  // Check if it's an @/ import
  if (!importPath.startsWith('@/')) {
    return importPath
  }

  // Get package-specific mappings
  let mappings = importMappings
  for (const [pkgPath, pkgMappings] of Object.entries(packageMappings)) {
    if (packagePath.startsWith(pkgPath)) {
      mappings = pkgMappings
      break
    }
  }

  // Apply mappings
  for (const [oldPrefix, newPrefix] of Object.entries(mappings)) {
    if (importPath.startsWith(oldPrefix)) {
      return importPath.replace(oldPrefix, newPrefix)
    }
  }

  return importPath
}

function refactorFile(filePath: string) {
  const sourceFile = project.addSourceFileAtPath(filePath)
  if (!sourceFile) {
    console.log(`Skipping ${filePath} - not found`)
    return
  }

  let changes = 0

  // Process all import declarations
  sourceFile.getImportDeclarations().forEach((importDecl) => {
    const moduleSpecifier = importDecl.getModuleSpecifierValue()
    const newModuleSpecifier = getImportPath(moduleSpecifier, filePath)

    if (moduleSpecifier !== newModuleSpecifier) {
      importDecl.setModuleSpecifier(newModuleSpecifier)
      changes++
      console.log(`  ${moduleSpecifier} → ${newModuleSpecifier}`)
    }
  })

  // Process dynamic imports
  sourceFile.getDescendantsOfKind(SyntaxKind.ImportKeyword).forEach((importKeyword) => {
    const importExpr = importKeyword.getParent()
    if (importExpr && importExpr.getKind() === SyntaxKind.CallExpression) {
      const callExpr = importExpr.asKindOrThrow(SyntaxKind.CallExpression)
      const args = callExpr.getArguments()
      if (args.length > 0 && args[0].getKind() === SyntaxKind.StringLiteral) {
        const stringLiteral = args[0].asKindOrThrow(SyntaxKind.StringLiteral)
        const moduleSpecifier = stringLiteral.getLiteralValue()
        const newModuleSpecifier = getImportPath(moduleSpecifier, filePath)

        if (moduleSpecifier !== newModuleSpecifier) {
          stringLiteral.setLiteralValue(newModuleSpecifier)
          changes++
          console.log(`  Dynamic: ${moduleSpecifier} → ${newModuleSpecifier}`)
        }
      }
    }
  })

  if (changes > 0) {
    sourceFile.saveSync()
    console.log(`✓ ${filePath} (${changes} changes)`)
  }
}

async function main() {
  console.log('🔧 Refactoring imports...\n')

  // Find all TypeScript files in packages
  const { execSync } = await import('child_process')
  const files = execSync('find packages -name "*.ts" -type f', { encoding: 'utf-8' })
    .trim()
    .split('\n')
    .filter((f) => f)

  console.log(`Found ${files.length} TypeScript files\n`)

  let totalChanges = 0
  files.forEach((file) => {
    try {
      refactorFile(file)
      totalChanges++
    } catch (error) {
      console.error(`✗ Error processing ${file}:`, error.message)
    }
  })

  console.log(`\n✅ Refactoring complete! Processed ${totalChanges} files`)
}

main().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})