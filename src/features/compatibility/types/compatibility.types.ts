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
  /** The raw requirement as the game states it, unmodified — shown as-is, never rephrased. */
  requirementLabel: string
  /** What was detected or manually entered for this component. */
  detectedLabel: string
  /** Short explanation, mainly for warn/unknown cases (why it's unverified, etc.). */
  note?: string
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
  /**
   * Highest DirectX API version the GPU supports. Absent means DirectX 12 —
   * only pre-DX12 entries in the table carry it.
   */
  maxDirectX?: number
  /** Absent means `'desktop'` so the consumer JSON stays compact. */
  formFactor?: 'desktop' | 'laptop' | 'igpu'
}

export interface CpuBenchmarkEntry extends BenchmarkEntry {
  /** PassMark Single-Thread score. */
  singleThreadScore: number
  /** PassMark Multi-Thread score. */
  multiThreadScore: number
  /** Physical cores (P + E cores on hybrid Intel parts). */
  cores: number
  /** Hardware threads — what `navigator.hardwareConcurrency` reports. */
  threads: number
  /**
   * Base clock in GHz. Informative only: it is NOT comparable across
   * generations (an i5-12400 at 2.5 GHz base is several times faster than a
   * Core 2 Duo at 3.0 GHz), so no verdict should be derived from it.
   */
  baseClockGhz: number
}
