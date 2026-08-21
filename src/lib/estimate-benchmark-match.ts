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
 * Intel Core iX-NNNN y AMD Ryzen X NNNN. El número de generación va delante
 * del SKU: 4 cifras → la primera ("i7-4770K" es 4ª gen), 5 cifras → las dos
 * primeras ("i7-12700K" es 12ª).
 */
function positionCpu(normalized: string): PositionedModel | null {
  const intel = normalized.match(/\bi([3579])\s*(\d{4,5})/)
  if (intel) {
    const sku = intel[2]
    return {
      family: 'intel-core',
      generation: Number(sku.length === 5 ? sku.slice(0, 2) : sku.slice(0, 1)),
      tier: Number(intel[1]) / 2,
    }
  }

  const ryzen = normalized.match(/\bryzen\s*([3579])\s*(\d{4})/)
  if (ryzen) {
    return {
      family: 'amd-ryzen',
      generation: Number(ryzen[2].slice(0, 1)),
      tier: Number(ryzen[1]) / 2,
    }
  }

  return null
}

/**
 * GeForce (GTX/RTX) y Radeon RX. La numeración de NVIDIA es continua entre
 * GTX y RTX (10 → 16 → 20 → 30 → 40 → 50), así que ambas comparten familia:
 * una GTX 1660 y una RTX 2060 son generaciones consecutivas de verdad.
 *
 * Radeon sí se separa en dos familias: en "RX 580" el 5 es la serie y el 80
 * la gama, mientras que en "RX 5700" el 5 es la serie y el 700 la gama.
 * Mezclarlas haría que la RX 580 pasara por hermana de la RX 5700.
 */
function positionGpu(normalized: string): PositionedModel | null {
  const nvidia = normalized.match(/\b(?:gtx|rtx)\s*(\d{3,4})\s*(ti super|super|ti)?\b/)
  if (nvidia) {
    const sku = Number(nvidia[1])
    return {
      family: 'nvidia-geforce',
      generation: Math.floor(sku / 100) / 10,
      tier: (sku % 100) / 10 + suffixStep(nvidia[2], NVIDIA_SUFFIX_STEPS),
    }
  }

  const radeon = normalized.match(/\brx\s*(\d{3,4})\s*(xtx|xt|gre)?\b/)
  if (radeon) {
    const sku = Number(radeon[1])
    const suffix = suffixStep(radeon[2], RADEON_SUFFIX_STEPS)

    // RX 400/500: tres cifras, la primera es la serie ("RX 580" → serie 5, gama 80).
    if (radeon[1].length === 3) {
      return {
        family: 'amd-radeon-rx-legacy',
        generation: Math.floor(sku / 100),
        tier: (sku % 100) / 10 + suffix,
      }
    }

    // A partir de RDNA 4, AMD pasó a numerar como NVIDIA: en "RX 9070" el 90
    // es la serie y el 70 la gama, mientras que en "RX 7700" el 7 es la serie
    // y el 700 la gama. Leer la nueva con la regla vieja daba gama 0,7 y
    // dejaba a las Radeon actuales sin ningún pariente cercano.
    const isCurrentScheme = sku >= 9000
    return {
      family: 'amd-radeon-rx',
      generation: isCurrentScheme ? Math.floor(sku / 100) / 10 : Math.floor(sku / 1000),
      tier: (isCurrentScheme ? sku % 100 : (sku % 1000) / 10) / 10 + suffix,
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
 *
 * La búsqueda por alias acepta que el alias esté *contenido* en el texto, y eso
 * puede colar una variante inferior cuando la superior no está tabulada: sin
 * una entrada "RTX 5070 Ti", el alias "rtx 5070" encaja igual y el sufijo se
 * pierde sin dejar rastro. Comparar la posición de ambos nombres detecta esa
 * pérdida para poder presentarla como lo que es, una aproximación.
 *
 * Solo se pronuncia sobre nombres que sabe situar y de la misma familia: si no
 * reconoce alguno, o pertenecen a marcas distintas —lo normal cuando el texto
 * enumera alternativas y gana la de otra marca—, no hay discrepancia que
 * señalar.
 */
export function describesSameModel(rawName: string, entryName: string): boolean {
  const requested = positionModel(rawName)
  const resolved = positionModel(entryName)

  if (!requested || !resolved || requested.family !== resolved.family) return true
  return requested.generation === resolved.generation && requested.tier === resolved.tier
}

/** Un salto de gama aleja más que uno de generación: un i7 no es un i5 nuevo. */
const TIER_WEIGHT = 1.5
const GENERATION_WEIGHT = 1

/**
 * Más allá de esto el "hermano" ya no se parece lo bastante como para que la
 * estimación aporte algo por encima de admitir que no conocemos el modelo.
 */
const MAX_SIBLING_DISTANCE = 3

function distanceBetween(a: PositionedModel, b: PositionedModel): number {
  return (
    Math.abs(a.generation - b.generation) * GENERATION_WEIGHT +
    Math.abs(a.tier - b.tier) * TIER_WEIGHT
  )
}

/**
 * Busca el modelo conocido más parecido a uno que no está en la tabla.
 *
 * Ninguna tabla de referencia va a listar cada SKU que existe, y hasta ahora
 * cualquier hueco terminaba en "no pudimos identificarlo" — un veredicto en
 * blanco aunque el modelo fuese, por ejemplo, un i7-10700 rodeado de i7 de
 * esa misma generación ya tabulados. Situando ambos por familia, generación y
 * gama se puede señalar el vecino más cercano y comparar contra él.
 *
 * Es explícitamente una aproximación: quien la use debe presentarla como tal
 * y nunca convertirla en un "no cumple" categórico. Empatan a favor del
 * modelo más débil, que es el lado conservador para un requisito.
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
