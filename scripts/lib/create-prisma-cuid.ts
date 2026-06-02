import { randomBytes } from 'node:crypto'
import { hostname } from 'node:os'

/**
 * CUID v1 compatible with Prisma `@default(cuid())`.
 * Inlined to avoid deprecated npm `cuid@3` (cuid2 uses a different format).
 */
const blockSize = 4
const base = 36
const discreteValues = base ** blockSize

let counter = 0

function pad(value: string, size: number): string {
  while (value.length < size) value = `0${value}`
  return value
}

function randomBlock(): string {
  const lim = 2 ** 32 - 1
  const n = Math.abs(randomBytes(4).readInt32BE() / lim)
  return pad((n * discreteValues).toString(base), blockSize)
}

function fingerprint(): string {
  const padding = 2
  const pid = pad(process.pid.toString(base), padding)
  const host = hostname()
  const hostId = pad(
    host
      .split('')
      .reduce((prev, char) => prev + char.charCodeAt(0), host.length + 36)
      .toString(base),
    padding
  )
  return pid + hostId
}

function nextCounter(): number {
  counter = counter < discreteValues ? counter : 0
  counter += 1
  return counter - 1
}

export function createPrismaCuid(): string {
  const timestamp = Date.now().toString(base)
  const count = pad(nextCounter().toString(base), blockSize)
  return `c${timestamp}${count}${fingerprint()}${randomBlock()}${randomBlock()}`
}
