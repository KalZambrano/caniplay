const NOISE_PATTERNS: RegExp[] = [
  /\(r\)/gi,
  /\(tm\)/gi,
  /[®™]/g,
  /\bor (better|newer|higher|greater|equivalent|comparable)\b/gi,
  /\b(cpu|gpu|vga|apu)\b/gi,
  /\b(processor|procesador|graphics card|video card|graphics adapter|tarjeta (de )?v[ií]deo)\b/gi,
  /@\s?[\d.]+\s?ghz/gi,
  // "i7-8700K", "i7 8700K" y "i7/8700K" nombran el mismo chip: los separadores
  // internos no aportan nada al match y sí provocaban fallos por puntuación.
  /[-_/]+/g,
  /\s{2,}/g,
]

/**
 * Reduces a raw hardware string (from a requirement blurb or the OS itself)
 * to a lowercase, punctuation-light form so it can be compared or matched
 * against the benchmark tables' aliases.
 */
export function normalizeHardwareName(raw: string): string {
  let value = raw

  for (const pattern of NOISE_PATTERNS) {
    value = value.replace(pattern, ' ')
  }

  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}
