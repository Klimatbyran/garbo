import { fileURLToPath } from 'url'

/**
 * Check if this script was called directly. Should be called with `import.meta.url`
 */
export function isMainModule(importMetaURL: string) {
  if (importMetaURL.startsWith('file:')) {
    return process.argv[1] === fileURLToPath(importMetaURL)
  }
}
