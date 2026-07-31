import type { BenchmarkEntry } from '@/features/compatibility/types/compatibility.types'
import { normalizeHardwareName } from './normalize-hardware-name'

/**
 * Finds the benchmark entry a free-text hardware name most likely refers to.
 *
 * Requirement text and detected GPU/CPU strings rarely match a table entry
 * character-for-character, so this tries an exact alias match first, then
 * falls back to the longest alias contained in the text (a min-spec line
 * like "Intel Core i5-9600K or AMD Ryzen 5 3600" contains two full aliases).
 *
 * Returns null rather than guessing when nothing matches — callers should
 * surface that as an "unknown" verdict, never a silent pass or fail.
 */
export function findBenchmarkMatch<T extends BenchmarkEntry>(
  rawName: string | null | undefined,
  table: readonly T[],
): T | null {
  if (!rawName) return null

  const target = normalizeHardwareName(rawName)
  if (!target) return null

  const exactMatch = table.find((entry) =>
    entry.aliases.some((alias) => normalizeHardwareName(alias) === target),
  )
  if (exactMatch) return exactMatch

  let bestMatch: T | null = null
  let bestAliasLength = 0

  for (const entry of table) {
    for (const alias of entry.aliases) {
      const normalizedAlias = normalizeHardwareName(alias)
      const isContained = normalizedAlias.length > 2 && target.includes(normalizedAlias)

      if (isContained && normalizedAlias.length > bestAliasLength) {
        bestMatch = entry
        bestAliasLength = normalizedAlias.length
      }
    }
  }

  return bestMatch
}
