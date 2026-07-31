export function formatRam(ramGb: number | null): string {
  return ramGb === null ? '—' : `≥ ${ramGb} GB`
}

export function formatVram(vramGb: number | null): string {
  return vramGb === null ? '—' : `~${vramGb} GB`
}

export function formatCores(cores: number | null): string {
  return cores === null ? '—' : `${cores}`
}
