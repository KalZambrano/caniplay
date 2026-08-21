export interface GenericCpuSpec {
  cores: number | null
  ghz: number | null
}

const CORE_WORD_PATTERNS: ReadonlyArray<[RegExp, number]> = [
  [/single[\s-]?core/, 1],
  [/dual[\s-]?core/, 2],
  [/triple[\s-]?core/, 3],
  [/quad[\s-]?core/, 4],
  [/hexa[\s-]?core/, 6],
  [/octa[\s-]?core/, 8],
]

function extractCores(text: string): number | null {
  const numericMatch = text.match(/(\d+)\s*[- ]?\s*core/)
  if (numericMatch) return Number(numericMatch[1])

  for (const [pattern, value] of CORE_WORD_PATTERNS) {
    if (pattern.test(text)) return value
  }

  return null
}

function extractGhz(text: string): number | null {
  const match = text.match(/(\d+(?:\.\d+)?)\s*ghz/)
  return match ? Number(match[1]) : null
}

/**
 * Reads a non-model CPU requirement like "Dual core from Intel or AMD at
 * 2.8 GHz" into comparable numbers. Returns null when neither dimension is
 * present — that means the text is more likely a specific model name we
 * simply don't have in the benchmark table, not a generic spec at all.
 */
export function parseGenericCpuSpec(text: string): GenericCpuSpec | null {
  const lower = text.toLowerCase()
  const cores = extractCores(lower)
  const ghz = extractGhz(lower)

  if (cores === null && ghz === null) return null
  return { cores, ghz }
}
