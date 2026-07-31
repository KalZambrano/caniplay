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
  cpuCores: number | null
  /** Browsers cannot read the CPU model — the user fills this in manually. */
  cpuModel: string | null
  webgpuSupported: boolean
}

export const createEmptyDetectedHardware = (): DetectedHardware => ({
  gpu: { name: null, vendor: null, vramGb: null, confidence: 'unknown' },
  ramGb: null,
  ramConfidence: 'unknown',
  cpuCores: null,
  cpuModel: null,
  webgpuSupported: false,
})
