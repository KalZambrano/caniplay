/**
 * How trustworthy a detected value is. Browsers never expose exact hardware,
 * so every reading needs an honest confidence label instead of a bare number.
 */
export type DetectionConfidence = 'measured' | 'estimated' | 'unknown'

export interface DetectedGpu {
  name: string | null
  vendor: string | null
  vramGb: number | null
  confidence: DetectionConfidence
}

export interface DetectedHardware {
  gpu: DetectedGpu
  ramGb: number | null
  ramConfidence: DetectionConfidence
  /**
   * Logical threads from `navigator.hardwareConcurrency` — NOT physical
   * cores: a 2-core/4-thread i3 reports 4. Physical cores can only be
   * inferred from it as a range (threads / 2 … threads).
   */
  cpuThreads: number | null
  /** Browsers cannot read the CPU model — the user fills this in manually. */
  cpuModel: string | null
  webgpuSupported: boolean
}

export const createEmptyDetectedHardware = (): DetectedHardware => ({
  gpu: { name: null, vendor: null, vramGb: null, confidence: 'unknown' },
  ramGb: null,
  ramConfidence: 'unknown',
  cpuThreads: null,
  cpuModel: null,
  webgpuSupported: false,
})
