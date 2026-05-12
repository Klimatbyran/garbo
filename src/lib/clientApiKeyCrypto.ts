import { createHash, timingSafeEqual } from 'node:crypto'

export function hashClientApiSecret(
  keyLookup: string,
  secretPart: string,
  pepper: string
): string {
  return createHash('sha256')
    .update(`${keyLookup}.${secretPart}.${pepper}`, 'utf8')
    .digest('hex')
}

/** Raw key format: `garb_<keyLookup>.<secretPart>` */
export function parseClientApiKey(raw: string): {
  keyLookup: string
  secretPart: string
} | null {
  if (!raw.startsWith('garb_')) return null
  const rest = raw.slice('garb_'.length)
  const dot = rest.indexOf('.')
  if (dot === -1) return null
  const keyLookup = rest.slice(0, dot)
  const secretPart = rest.slice(dot + 1)
  if (!keyLookup || !secretPart) return null
  return { keyLookup, secretPart }
}

export function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, 'hex')
    const bb = Buffer.from(b, 'hex')
    if (ba.length !== bb.length) return false
    return timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}
