import gpuBenchmarks from '@/data/gpu-benchmarks.json'
import { findBenchmarkMatch } from '@/lib/benchmark-lookup'
import type { GpuBenchmarkEntry } from '@/features/compatibility/types/compatibility.types'
import type { DetectedGpu, DetectedHardware, DetectionConfidence } from '../types/hardware.types'
import { parseWebglRenderer, type ParsedGpuString } from '../utils/parse-webgl-renderer'

async function detectGpuViaWebGpu(): Promise<ParsedGpuString | null> {
  if (!navigator.gpu) return null

  try {
    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) return null

    const info = adapter.info ?? (await adapter.requestAdapterInfo?.())
    if (!info) return null

    const name = info.device || info.description || null
    if (!name) return null

    return { vendor: info.vendor ?? null, name }
  } catch {
    return null
  }
}

function detectGpuViaWebGl(): ParsedGpuString | null {
  try {
    const canvas = document.createElement('canvas')
    const gl = (canvas.getContext('webgl2') ??
      canvas.getContext('webgl')) as WebGLRenderingContext | null
    if (!gl) return null

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    if (!debugInfo) return null

    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string
    if (!renderer) return null

    return parseWebglRenderer(renderer)
  } catch {
    return null
  }
}

async function detectGpu(): Promise<DetectedGpu> {
  const detected = (await detectGpuViaWebGpu()) ?? detectGpuViaWebGl()

  if (!detected?.name) {
    return { name: null, vendor: null, vramGb: null, confidence: 'unknown' }
  }

  const match = findBenchmarkMatch<GpuBenchmarkEntry>(
    detected.name,
    gpuBenchmarks as GpuBenchmarkEntry[],
  )

  return {
    name: detected.name,
    vendor: detected.vendor,
    vramGb: match?.vramGb ?? null,
    confidence: match ? 'estimated' : 'unknown',
  }
}

function detectRam(): { ramGb: number | null; confidence: DetectionConfidence } {
  const deviceMemory = navigator.deviceMemory

  if (typeof deviceMemory !== 'number') {
    return { ramGb: null, confidence: 'unknown' }
  }

  // Chrome caps this value (e.g. reports 8 for machines with 16/32/64 GB),
  // so it's always a floor, never the exact amount.
  return { ramGb: deviceMemory, confidence: 'estimated' }
}

function detectCpuCores(): number | null {
  return navigator.hardwareConcurrency ?? null
}

export async function detectHardware(): Promise<DetectedHardware> {
  const gpu = await detectGpu()
  const ram = detectRam()

  return {
    gpu,
    ramGb: ram.ramGb,
    ramConfidence: ram.confidence,
    cpuCores: detectCpuCores(),
    cpuModel: null,
    webgpuSupported: typeof navigator.gpu !== 'undefined',
  }
}
