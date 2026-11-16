/**
 * Legacy BullMQ v5 repeatable job keys use:
 * `name:id:endDate:tz:pattern` (or `every` as a numeric suffix).
 *
 * Ported from BullMQ's hasLegacyRepeatableKeyShape so we can delete only
 * those keys without wiping v6 Job Scheduler metadata that shares the
 * `bull:<queue>:repeat:*` prefix.
 */
function isNumericSegment(key: string, from: number, to: number): boolean {
  if (from >= to) return false
  for (let i = from; i < to; i++) {
    const charCode = key.charCodeAt(i)
    if (charCode < 48 || charCode > 57) return false
  }
  return true
}

export function hasLegacyRepeatableKeyShape(key: string): boolean {
  const firstColon = key.indexOf(':')
  if (firstColon === -1) return false

  const secondColon = key.indexOf(':', firstColon + 1)
  if (secondColon === -1) return false

  const thirdColon = key.indexOf(':', secondColon + 1)
  if (thirdColon === -1) return false

  const fourthColon = key.indexOf(':', thirdColon + 1)
  if (fourthColon === -1) return false

  if (
    secondColon + 1 < thirdColon &&
    !isNumericSegment(key, secondColon + 1, thirdColon)
  ) {
    return false
  }

  const suffixStart = fourthColon + 1
  if (suffixStart >= key.length) return false

  if (key.indexOf(' ', suffixStart) !== -1) return true

  return isNumericSegment(key, suffixStart, key.length)
}
