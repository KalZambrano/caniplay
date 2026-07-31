export type ComponentKey = 'cpu' | 'gpu' | 'ram' | 'storage'

/**
 * `unknown` covers cases where a component genuinely can't be verified —
 * e.g. the user hasn't entered their CPU model, or the requirement text
 * couldn't be matched against the benchmark tables. It is never guessed away.
 */
export type VerdictStatus = 'pass' | 'warn' | 'fail' | 'unknown'

export interface ComponentVerdict {
  component: ComponentKey
  status: VerdictStatus
  detail: string
}

export interface RequirementVerdict {
  tier: 'minimum' | 'recommended'
  overall: VerdictStatus
  components: ComponentVerdict[]
}

export interface CompatibilityReportData {
  minimum: RequirementVerdict | null
  recommended: RequirementVerdict | null
}

export interface BenchmarkEntry {
  name: string
  aliases: string[]
  score: number
}

export interface GpuBenchmarkEntry extends BenchmarkEntry {
  vramGb: number
}
