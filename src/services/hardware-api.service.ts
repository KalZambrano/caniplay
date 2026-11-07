import { env } from '@/config/env'
import type { CompatibilityReportData } from '@/features/compatibility/types/compatibility.types'
import type { GameRequirementSet } from '@/features/game-search/types/game.types'
import type { DetectedHardware } from '@/features/hardware-detection/types/hardware.types'

export type HardwareKind = 'cpu' | 'gpu'

export interface HardwareSearchItem {
  id: string
  name: string
  type: HardwareKind
  vendor: string
  formFactor: string
  releaseYear: number | null
  score: number
  vramGb?: number
  cores?: number
  threads?: number
}

export interface ResolvedGpuCatalogEntry {
  id: string
  name: string
  vendor: string
  architecture: string | null
  formFactor: string
  releaseYear: number | null
  score: number
  vramGb: number
  maxDirectX: number
  rayTracing: boolean
}

export interface HardwareResolveResponse<TEntry = ResolvedGpuCatalogEntry> {
  matched: boolean
  approximate: boolean
  effectiveScore: number | null
  adjustmentNote?: string
  entry: TEntry | null
}

/**
 * Remote hardware D1 endpoints are active whenever a backend URL is configured
 * and local mock mode is not forced.
 */
export function isHardwareApiEnabled(): boolean {
  return !env.useMockData && Boolean(env.apiBaseUrl)
}

export async function compareCompatibilityRemote(
  requirements: GameRequirementSet,
  hardware: DetectedHardware,
  signal?: AbortSignal,
): Promise<CompatibilityReportData> {
  const url = new URL('/hardware/compare', env.apiBaseUrl)
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hardware, requirements }),
    signal,
  })

  if (!response.ok) {
    throw new Error(`No se pudo evaluar la compatibilidad (status ${response.status})`)
  }

  return response.json() as Promise<CompatibilityReportData>
}

export async function searchHardwareRemote(
  type: HardwareKind,
  query: string,
  limit = 25,
  signal?: AbortSignal,
): Promise<HardwareSearchItem[]> {
  const url = new URL('/hardware/search', env.apiBaseUrl)
  url.searchParams.set('type', type)
  url.searchParams.set('q', query)
  url.searchParams.set('limit', String(limit))

  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`No se pudo buscar hardware (status ${response.status})`)
  }

  return response.json() as Promise<HardwareSearchItem[]>
}

export async function resolveHardwareRemote<TEntry = ResolvedGpuCatalogEntry>(
  type: HardwareKind,
  name: string,
  signal?: AbortSignal,
): Promise<HardwareResolveResponse<TEntry>> {
  const url = new URL('/hardware/resolve', env.apiBaseUrl)
  url.searchParams.set('type', type)
  url.searchParams.set('name', name)

  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`No se pudo resolver el modelo de hardware (status ${response.status})`)
  }

  return response.json() as Promise<HardwareResolveResponse<TEntry>>
}
