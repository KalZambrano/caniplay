import type { BenchmarkEntry } from '@/features/compatibility/types/compatibility.types'
import { normalizeHardwareName } from './normalize-hardware-name'

/**
 * Finds the benchmark entry a free-text hardware name most likely refers to.
 *
 * Requirement text and detected GPU/CPU strings rarely match a table entry
 * character-for-character, so this tries an exact alias match first, then
 * falls back to scanning for aliases contained in the text.
 *
 * Cuando el texto contiene varios modelos —una línea de mínimos como
 * "Intel Core i5-9600K or AMD Ryzen 5 3600" nombra dos— gana el de menor
 * score: ese "or" significa que cualquiera de los dos basta, así que la
 * barra real del juego es el más débil. Elegir por longitud del alias, como
 * se hacía antes, daba un ganador arbitrario y podía inflar el requisito.
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

  for (const entry of table) {
    const isContained = entry.aliases.some((alias) => {
      const normalizedAlias = normalizeHardwareName(alias)
      return normalizedAlias.length > 2 && target.includes(normalizedAlias)
    })

    if (isContained && (bestMatch === null || entry.score < bestMatch.score)) {
      bestMatch = entry
    }
  }

  return bestMatch
}
