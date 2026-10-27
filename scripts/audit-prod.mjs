#!/usr/bin/env node
/**
 * Production dependency audit with a narrow allowlist for known false positives.
 *
 * GHSA-mrhx-c7xc-m3w5 is filed as `zod < 4.6.6`, but the advisory describes a
 * Zod 4-only code path (`$ZodArray` / `handleArrayResult`). Garbo's direct
 * dependency is still Zod 3, which is unaffected. Nested Zod 4 copies must be
 * patched (>= 4.6.6) or this script fails closed.
 */
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ZOD_MEMORY_GHSA = 'GHSA-mrhx-c7xc-m3w5'
const ZOD4_PATCHED = '4.6.6'

function parseVersion(version) {
  const match = String(version).match(/^(\d+)\.(\d+)\.(\d+)/)
  if (!match) return null
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  }
}

function versionGte(version, minimum) {
  const left = parseVersion(version)
  const right = parseVersion(minimum)
  if (!left || !right) return false
  if (left.major !== right.major) return left.major > right.major
  if (left.minor !== right.minor) return left.minor > right.minor
  return left.patch >= right.patch
}

function collectZodInstalls(dir = join(ROOT, 'node_modules'), acc = []) {
  if (!existsSync(dir)) return acc

  const zodPkg = join(dir, 'zod', 'package.json')
  if (existsSync(zodPkg)) {
    const pkg = JSON.parse(readFileSync(zodPkg, 'utf8'))
    acc.push({ path: zodPkg, version: pkg.version })
  }

  for (const entry of readdirSync(dir)) {
    if (entry === '.bin') continue
    const full = join(dir, entry)
    let stats
    try {
      stats = statSync(full)
    } catch {
      continue
    }
    if (!stats.isDirectory()) continue

    if (entry.startsWith('@')) {
      for (const scoped of readdirSync(full)) {
        const nested = join(full, scoped, 'node_modules')
        if (existsSync(nested)) collectZodInstalls(nested, acc)
      }
      continue
    }

    const nested = join(full, 'node_modules')
    if (existsSync(nested)) collectZodInstalls(nested, acc)
  }

  return acc
}

function advisoryIdFromVia(via) {
  if (!via || typeof via !== 'object') return null
  const url = String(via.url || '')
  const match = url.match(/GHSA-[a-z0-9-]+/i)
  return match ? match[0] : null
}

function zodMemoryFalsePositiveApplies(zodInstalls) {
  const zod3Installs = zodInstalls.filter((install) =>
    String(install.version).startsWith('3.'),
  )
  const zod4Installs = zodInstalls.filter((install) =>
    String(install.version).startsWith('4.'),
  )
  const unpatchedZod4 = zod4Installs.filter(
    (install) => !versionGte(install.version, ZOD4_PATCHED),
  )
  return zod3Installs.length > 0 && unpatchedZod4.length === 0
}

function isDirectZodMemoryFalsePositive(vuln, zodInstalls) {
  if (vuln.name !== 'zod') return false
  const vias = Array.isArray(vuln.via) ? vuln.via : []
  const advisoryVias = vias.filter((via) => typeof via === 'object')
  if (advisoryVias.length === 0) return false
  if (!advisoryVias.every((via) => advisoryIdFromVia(via) === ZOD_MEMORY_GHSA)) {
    return false
  }
  return zodMemoryFalsePositiveApplies(zodInstalls)
}

function isAllowlisted(name, vulnerabilities, allowlisted, zodInstalls) {
  if (allowlisted.has(name)) return true
  const vuln = vulnerabilities[name]
  if (!vuln) return false

  if (isDirectZodMemoryFalsePositive(vuln, zodInstalls)) {
    allowlisted.add(name)
    return true
  }

  const vias = Array.isArray(vuln.via) ? vuln.via : []
  if (vias.length === 0) return false
  if (!vias.every((via) => typeof via === 'string')) return false

  // Mark tentatively to break cycles, then confirm all edges are allowlisted.
  allowlisted.add(name)
  const allAllowlisted = vias.every((viaName) =>
    isAllowlisted(viaName, vulnerabilities, allowlisted, zodInstalls),
  )
  if (!allAllowlisted) allowlisted.delete(name)
  return allAllowlisted
}

const audit = spawnSync('npm', ['audit', '--omit=dev', '--json'], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 32 * 1024 * 1024,
})

let report
try {
  report = JSON.parse(audit.stdout || '{}')
} catch {
  console.error('Failed to parse npm audit JSON output')
  console.error(audit.stdout)
  console.error(audit.stderr)
  process.exit(1)
}

if (audit.status === 0) {
  console.log('npm audit --omit=dev: clean')
  process.exit(0)
}

const zodInstalls = collectZodInstalls()
const vulnerabilities = report.vulnerabilities || {}
const allowlisted = new Set()
const remaining = Object.keys(vulnerabilities).filter(
  (name) => !isAllowlisted(name, vulnerabilities, allowlisted, zodInstalls),
)

if (remaining.length === 0) {
  console.log(
    'npm audit --omit=dev: clean after allowlisting Zod 3 false positive',
  )
  console.log(
    `${ZOD_MEMORY_GHSA} ignored because installed Zod majors are 3.x and patched 4.x (>= ${ZOD4_PATCHED}).`,
  )
  for (const install of zodInstalls) {
    console.log(`- zod@${install.version}`)
  }
  process.exit(0)
}

console.error('npm audit --omit=dev: vulnerabilities remain')
for (const name of remaining) {
  const vuln = vulnerabilities[name]
  console.error(`- ${name}: ${vuln.severity} (${vuln.range || 'n/a'})`)
}
spawnSync('npm', ['audit', '--omit=dev'], {
  cwd: ROOT,
  encoding: 'utf8',
  stdio: 'inherit',
})
process.exit(1)
