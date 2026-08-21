import type { DetectionConfidence } from '../types/hardware.types'

/**
 * Lo detectado por el navegador es siempre un piso (`≥`); lo que la persona
 * eligió a mano es exacto y se muestra tal cual.
 */
export function formatRam(
  ramGb: number | null,
  confidence: DetectionConfidence = 'estimated',
): string {
  if (ramGb === null) return '—'
  return confidence === 'estimated' ? `≥ ${ramGb} GB` : `${ramGb} GB`
}

export function formatVram(vramGb: number | null): string {
  return vramGb === null ? '—' : `~${vramGb} GB`
}

export function formatCores(cores: number | null): string {
  return cores === null ? '—' : `${cores}`
}
