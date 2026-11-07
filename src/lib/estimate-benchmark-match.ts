import type { BenchmarkEntry } from '@/features/compatibility/types/compatibility.types'
import { normalizeHardwareName } from './normalize-hardware-name'

/**
 * Un modelo situado dentro de su familia comercial.
 *
 * `generation` y `tier` están expresados en "pasos de producto", no en las
 * cifras crudas del nombre: una generación de diferencia vale 1 tanto entre
 * un i5-8400 y un i5-9400F como entre una RTX 3060 y una RTX 4060, y un
 * escalón de gama (i5 → i7, RTX x060 → x070) vale también 1. Así una única
 * fórmula de distancia sirve para CPUs y GPUs sin ponderar por familia.
 */
interface PositionedModel {
  family: string
  generation: number
  tier: number
  mobile: boolean
}

/** Sufijos que empujan un modelo por encima de su gama base, en pasos de gama. */
const NVIDIA_SUFFIX_STEPS: ReadonlyArray<[RegExp, number]> = [
  [/^ti\s*super$/, 0.7],
  [/^super$/, 0.3],
  [/^ti$/, 0.5],
]

const RADEON_SUFFIX_STEPS: ReadonlyArray<[RegExp, number]> = [
  [/^xtx$/, 0.8],
  [/^xt$/, 0.5],
  [/^gre$/, 0.3],
]

function suffixStep(suffix: string | undefined, steps: ReadonlyArray<[RegExp, number]>): number {
  if (!suffix) return 0
  const normalized = suffix.trim().replace(/\s+/g, ' ')
  return steps.find(([pattern]) => pattern.test(normalized))?.[1] ?? 0
}

/**
 * Intel Core (1ª–14ª gen + Core Ultra) y AMD Ryzen. El sufijo distingue chips
 * de portátil (U/P/H/HX/HS) de los de escritorio (K/KF/F/X/X3D) para no dar por
 * idéntico un i7 de 15 W con uno de 125 W.
 */
function positionCpu(normalized: string): PositionedModel | null {
  const ultra = normalized.match(/\bcore\s+ultra\s+([579])\s+(\d{3})([a-z]{0,2})\b/)
  if (ultra) {
    const sku = Number(ultra[2])
    const suffix = ultra[3] ?? ''
    return {
      family: 'intel-core',
      generation: 14 + Math.floor(sku / 100),
      tier: Number(ultra[1]) / 2,
      mobile: /^(u|p|h|hx|v)$/.test(suffix),
    }
  }

  const intel = normalized.match(/\bi([3579])\s*(\d{3,5})([a-z]{0,2}\d?)\b/)
  if (intel) {
    const sku = intel[2]
    const suffix = intel[3] ?? ''
    const generation =
      sku.length === 5 ? Number(sku.slice(0, 2)) : sku.length === 4 ? Number(sku.slice(0, 1)) : 1
    return {
      family: 'intel-core',
      generation,
      tier: Number(intel[1]) / 2,
      mobile: /^(u|p|h|hx|hs|hq|hk|mq|qm|m|y|g\d)$/.test(suffix),
    }
  }

  const ryzen = normalized.match(/\bryzen\s*([3579])\s*(\d{4})([a-z0-9]{0,3})\b/)
  if (ryzen) {
    const suffix = ryzen[3] ?? ''
    const x3dStep = suffix === 'x3d' ? 0.4 : 0
    return {
      family: 'amd-ryzen',
      generation: Number(ryzen[2].slice(0, 1)),
      tier: Number(ryzen[1]) / 2 + x3dStep,
      mobile: /^(u|h|hs|hx|c|e)$/.test(suffix),
    }
  }

  return null
}

function hasMobileGpuMarker(normalized: string): boolean {
  return (
    /\b(mobile|laptop|max q|notebook|mobility)\b/.test(normalized) ||
    /\b(?:gtx|rtx|gt|gts|rx|hd|r[579]|arc)\s*[ab]?\d{3,4}m\b/.test(normalized)
  )
}

/**
 * GeForce (GTX/RTX), Radeon RX e Intel Arc. La numeración de NVIDIA es continua
 * entre GTX y RTX, mientras que Radeon se separa entre RX 400/500 (tres cifras)
 * y RX 5000–9000 (cuatro cifras).
 */
function positionGpu(normalized: string): PositionedModel | null {
  const mobile = hasMobileGpuMarker(normalized)

  const nvidia = normalized.match(/\b(?:gtx|rtx)\s*(\d{3,4})m?\s*(ti super|super|ti)?\b/)
  if (nvidia) {
    const sku = Number(nvidia[1])
    return {
      family: 'nvidia-geforce',
      generation: Math.floor(sku / 100) / 10,
      tier: (sku % 100) / 10 + suffixStep(nvidia[2], NVIDIA_SUFFIX_STEPS),
      mobile,
    }
  }

  const radeon = normalized.match(/\brx\s*(\d{3,4})m?\s*(xtx|xt|gre)?\b/)
  if (radeon) {
    const sku = Number(radeon[1])
    const suffix = suffixStep(radeon[2], RADEON_SUFFIX_STEPS)

    if (radeon[1].length === 3) {
      return {
        family: 'amd-radeon-rx-legacy',
        generation: Math.floor(sku / 100),
        tier: (sku % 100) / 10 + suffix,
        mobile,
      }
    }

    const isCurrentScheme = sku >= 9000
    return {
      family: 'amd-radeon-rx',
      generation: isCurrentScheme ? Math.floor(sku / 100) / 10 : Math.floor(sku / 1000),
      tier: (isCurrentScheme ? sku % 100 : (sku % 1000) / 10) / 10 + suffix,
      mobile,
    }
  }

  const arc = normalized.match(/\barc\s+([ab])(\d{3})m?\b/)
  if (arc) {
    const gen = arc[1] === 'a' ? 1 : 2
    const sku = Number(arc[2])
    return {
      family: 'intel-arc',
      generation: gen,
      tier: Math.floor(sku / 10) / 10,
      mobile,
    }
  }

  return null
}

function positionModel(rawName: string): PositionedModel | null {
  const normalized = normalizeHardwareName(rawName)
  if (!normalized) return null
  return positionCpu(normalized) ?? positionGpu(normalized)
}

/**
 * ¿El nombre pedido y la entrada que le asignó el buscador de aliases son de
 * verdad el mismo modelo?
 */
export function describesSameModel(rawName: string, entryName: string): boolean {
  const requested = positionModel(rawName)
  const resolved = positionModel(entryName)

  if (!requested || !resolved || requested.family !== resolved.family) return true
  return (
    requested.generation === resolved.generation &&
    requested.tier === resolved.tier &&
    requested.mobile === resolved.mobile
  )
}

/** Un salto de gama aleja más que uno de generación: un i7 no es un i5 nuevo. */
const TIER_WEIGHT = 1.5
const GENERATION_WEIGHT = 1
const FORM_FACTOR_WEIGHT = 1.2

/**
 * Más allá de esto el "hermano" ya no se parece lo bastante como para que la
 * estimación aporte algo por encima de admitir que no conocemos el modelo.
 */
const MAX_SIBLING_DISTANCE = 3

function distanceBetween(a: PositionedModel, b: PositionedModel): number {
  return (
    Math.abs(a.generation - b.generation) * GENERATION_WEIGHT +
    Math.abs(a.tier - b.tier) * TIER_WEIGHT +
    (a.mobile !== b.mobile ? FORM_FACTOR_WEIGHT : 0)
  )
}

/**
 * Busca el modelo conocido más parecido a uno que no está en la tabla.
 */
export function findApproximateBenchmarkMatch<T extends BenchmarkEntry>(
  rawName: string | null | undefined,
  table: readonly T[],
): T | null {
  if (!rawName) return null

  const target = positionModel(rawName)
  if (!target) return null

  let best: { entry: T; distance: number } | null = null

  for (const entry of table) {
    const candidate = positionModel(entry.name)
    if (!candidate || candidate.family !== target.family) continue

    const distance = distanceBetween(target, candidate)
    if (distance > MAX_SIBLING_DISTANCE) continue

    const isBetter =
      best === null ||
      distance < best.distance ||
      (distance === best.distance && entry.score < best.entry.score)

    if (isBetter) best = { entry, distance }
  }

  return best?.entry ?? null
}
