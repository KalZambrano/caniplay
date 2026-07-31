const GRADIENTS = [
  'from-brand/30 via-bg-elevated to-bg',
  'from-good/25 via-bg-elevated to-bg',
  'from-warn/25 via-bg-elevated to-bg',
  'from-bad/25 via-bg-elevated to-bg',
  'from-unknown/25 via-bg-elevated to-bg',
] as const

/** Picks a stable gradient for a given seed (e.g. a game id) so it never flickers between renders. */
export function pickGradient(seed: string): string {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0
  }
  return GRADIENTS[hash % GRADIENTS.length]
}
