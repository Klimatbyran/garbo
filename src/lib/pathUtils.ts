export function createSafeFolderName(url: string): string {
  // Remove protocol and create safe folder name
  return url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 100) // Limit length
} 