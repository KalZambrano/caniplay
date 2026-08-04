export interface GenericGpuSpec {
  vramMb: number
}

/**
 * Reads a non-model GPU requirement like "128 MB video card" or "Graphics
 * card with 1 GB VRAM" into a comparable VRAM figure. Returns null when no
 * amount is present at all — e.g. "DX10 compatible graphics card" has
 * nothing numeric left to compare once it's not a recognized model.
 */
export function parseGenericGpuSpec(text: string): GenericGpuSpec | null {
  const lower = text.toLowerCase()

  const gbMatch = lower.match(/(\d+(?:\.\d+)?)\s*gb/)
  if (gbMatch) return { vramMb: Number(gbMatch[1]) * 1024 }

  const mbMatch = lower.match(/(\d+(?:\.\d+)?)\s*mb/)
  if (mbMatch) return { vramMb: Number(mbMatch[1]) }

  return null
}
