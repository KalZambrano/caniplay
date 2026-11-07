import gpuBenchmarks from '@/data/gpu-benchmarks.json'
import cpuBenchmarks from '@/data/cpu-benchmarks.json'
import { findBenchmarkMatch, splitModelAlternatives } from '@/lib/benchmark-lookup'
import { describesSameModel, findApproximateBenchmarkMatch } from '@/lib/estimate-benchmark-match'
import { detectMobileGpuVariant, hasMobileCounterpart } from '@/lib/mobile-gpu-variant'
import { COMPATIBILITY_WARN_THRESHOLD_RATIO, RAM_WARN_THRESHOLD_RATIO } from '@/config/constants'
import { formatRam } from '@/features/hardware-detection/utils/format-hardware'
import type { DetectedHardware } from '@/features/hardware-detection/types/hardware.types'
import type { HardwareRequirement } from '@/features/game-search/types/game.types'
import type {
  BenchmarkEntry,
  ComponentVerdict,
  CpuBenchmarkEntry,
  GpuBenchmarkEntry,
} from '../types/compatibility.types'
import { parseGenericCpuSpec, type GenericCpuSpec } from './parse-generic-cpu-spec'
import { parseGenericGpuSpec } from './parse-generic-gpu-spec'

const typedGpuBenchmarks = gpuBenchmarks as GpuBenchmarkEntry[]
const typedCpuBenchmarks = cpuBenchmarks as CpuBenchmarkEntry[]

export function compareRam(
  hardware: DetectedHardware,
  requirement: HardwareRequirement,
): ComponentVerdict {
  const required = requirement.ramGb
  const detected = hardware.ramGb
  const detectedLabel = formatRam(detected, hardware.ramConfidence)
  const requirementLabel = required !== null ? `${required} GB` : 'No especificado'
  // El navegador solo da un piso; si la persona eligió su RAM a mano, el
  // número es exacto y quedarse corto es un fallo, no una duda.
  const isBrowserEstimate = hardware.ramConfidence === 'estimated'

  if (required === null) {
    return {
      component: 'ram',
      status: 'unknown',
      requirementLabel,
      detectedLabel: detected !== null ? detectedLabel : 'No detectada',
    }
  }

  if (detected === null) {
    return { component: 'ram', status: 'unknown', requirementLabel, detectedLabel: 'No detectada' }
  }

  if (detected >= required) {
    return {
      component: 'ram',
      status: 'pass',
      requirementLabel,
      detectedLabel,
    }
  }

  if (isBrowserEstimate) {
    return {
      component: 'ram',
      status: 'warn',
      requirementLabel,
      detectedLabel,
      note: 'Estimación mínima del navegador — tu RAM real podría ser mayor.',
    }
  }

  // Quedarse algo corto no impide arrancar: el sistema tira de disco y el
  // juego da tirones. Muy por debajo, sí deja de ser jugable.
  if (detected >= required * RAM_WARN_THRESHOLD_RATIO) {
    return {
      component: 'ram',
      status: 'warn',
      requirementLabel,
      detectedLabel,
      note: 'Algo por debajo: el sistema usará el disco como memoria y puede haber tirones.',
    }
  }

  return { component: 'ram', status: 'fail', requirementLabel, detectedLabel }
}

export function compareStorage(requirement: HardwareRequirement): ComponentVerdict {
  return {
    component: 'storage',
    status: 'unknown',
    requirementLabel:
      requirement.storageGb !== null ? `${requirement.storageGb} GB` : 'No especificado',
    detectedLabel: 'No verificable',
    note: 'El navegador no puede leer tu espacio en disco.',
  }
}

/**
 * Un modelo llevado a una entrada de la tabla, recordando si el nombre encajó
 * de verdad o si solo pudimos situarlo junto a su pariente más cercano.
 */
interface ResolvedModel<T extends BenchmarkEntry> {
  entry: T
  /** El nombre no encajó con ninguna entrada: se usa el pariente más cercano. */
  approximate: boolean
  /**
   * El modelo sí se reconoció, pero su score se ajustó por estimación (p. ej.
   * una GPU de portátil escalada desde su versión de escritorio).
   */
  adjustmentNote?: string
  /**
   * El modelo es de portátil: el navegador no expone su límite de potencia
   * (TGP), que cambia bastante el rendimiento real entre fabricantes.
   */
  hasLaptopPowerVariance?: boolean
}

/** ¿El veredicto descansa en algo estimado o con varianza de potencia no observable? */
function isEstimate(model: ResolvedModel<BenchmarkEntry>): boolean {
  return (
    model.approximate || model.adjustmentNote !== undefined || Boolean(model.hasLaptopPowerVariance)
  )
}

/**
 * Resuelve un nombre libre contra la tabla: primero por nombre/alias y, si el
 * modelo no está tabulado, por el hermano de familia más parecido.
 */
function resolveModel<T extends BenchmarkEntry>(
  rawName: string | null | undefined,
  table: readonly T[],
): ResolvedModel<T> | null {
  const matched = findBenchmarkMatch(rawName, table)

  if (matched && rawName) {
    const namesOneModel = splitModelAlternatives(rawName).length === 1
    return {
      entry: matched,
      approximate: namesOneModel && !describesSameModel(rawName, matched.name),
    }
  }

  const approximate = findApproximateBenchmarkMatch(rawName, table)
  return approximate ? { entry: approximate, approximate: true } : null
}

/**
 * Resuelve una GPU priorizando las entradas reales de portátil de TechPowerUp
 * y cayendo al factor heurístico sobre la versión de escritorio solo cuando la
 * variante móvil concreta no existe en la tabla.
 */
function resolveGpuModel(
  rawName: string | null | undefined,
): ResolvedModel<GpuBenchmarkEntry> | null {
  const direct = resolveModel(rawName, typedGpuBenchmarks)
  const variant = rawName ? detectMobileGpuVariant(rawName) : null

  if (!variant) {
    if (direct && direct.entry.formFactor === 'laptop') {
      return { ...direct, hasLaptopPowerVariance: true }
    }
    return direct
  }

  // Si la tabla ya tiene el chip móvil real (p. ej. "RTX 3060 Mobile" o "RX 6800M"),
  // usamos sus especificaciones reales en lugar de aplicar una penalización ciega.
  if (direct && !direct.approximate && direct.entry.formFactor === 'laptop') {
    if (variant.label === 'Max-Q' && !/\bmax-q\b/i.test(direct.entry.name)) {
      return {
        entry: {
          ...direct.entry,
          name: `${direct.entry.name} (Max-Q)`,
          score: direct.entry.score * 0.85,
        },
        approximate: false,
        hasLaptopPowerVariance: true,
        adjustmentNote:
          'Variante Max-Q ajustada sobre las especificaciones móviles de referencia (~85 %).',
      }
    }
    return { ...direct, hasLaptopPowerVariance: true }
  }

  // Si es una integrada (Iris Xe, Radeon 780M/890M), no tiene contraparte de escritorio que escalar.
  if (direct && direct.entry.formFactor === 'igpu') {
    return direct
  }

  const desktop = resolveModel(variant.desktopName, typedGpuBenchmarks)
  if (!desktop || !hasMobileCounterpart(desktop.entry.name)) return direct ?? desktop

  const percent = Math.round(variant.factor * 100)
  const variantLabel = variant.label === 'Max-Q' ? 'Max-Q' : 'de portátil'
  return {
    entry: {
      ...desktop.entry,
      name: `${desktop.entry.name} ${variant.label}`,
      score: desktop.entry.score * variant.factor,
    },
    approximate: desktop.approximate,
    hasLaptopPowerVariance: true,
    adjustmentNote: `Las GPUs ${variantLabel} rinden menos que su versión de escritorio; estimamos ~${percent} % de una ${desktop.entry.name}.`,
  }
}

/** Deja claro qué lado de la comparación se apoyó en un modelo equivalente. */
function buildApproximationNote(
  required: ResolvedModel<BenchmarkEntry>,
  detected: ResolvedModel<BenchmarkEntry>,
): string | null {
  const approximations: string[] = []

  if (required.approximate) approximations.push(`el requisito contra ${required.entry.name}`)
  if (detected.approximate) approximations.push(`tu equipo contra ${detected.entry.name}`)
  if (approximations.length === 0) return null

  return `No tenemos datos exactos de ese modelo, así que comparamos ${approximations.join(' y ')}, lo más parecido que conocemos.`
}

function joinNotes(...notes: (string | null | undefined)[]): string | undefined {
  const present = notes.filter((note): note is string => Boolean(note))
  return present.length > 0 ? present.join(' ') : undefined
}

/**
 * Qué se le dice a la persona cuando queda algo por debajo, por componente:
 * la GPU se compensa con ajustes gráficos, el CPU no.
 */
const SHORTFALL_NOTE: Record<'cpu' | 'gpu', string> = {
  gpu: 'Probablemente corra bajando resolución o calidad, o activando escalado (FSR/DLSS).',
  cpu: 'Algo por debajo: bajar gráficos no compensa el CPU, así que puede haber caídas de FPS.',
}

const LAPTOP_TGP_NOTE =
  'En portátiles el rendimiento real varía según el límite de potencia (TGP) de cada equipo.'

/** Shared "known model vs known model" scoring, once both sides resolved to a table entry. */
function buildRatioVerdict<T extends BenchmarkEntry>(
  component: 'cpu' | 'gpu',
  requirementLabel: string,
  detectedLabel: string,
  detected: ResolvedModel<T>,
  required: ResolvedModel<T>,
): ComponentVerdict {
  const ratio = detected.entry.score / required.entry.score
  const isApproximate = isEstimate(detected) || isEstimate(required)
  const laptopTgpNote =
    (detected.hasLaptopPowerVariance || required.hasLaptopPowerVariance) &&
    !detected.adjustmentNote &&
    !required.adjustmentNote
      ? LAPTOP_TGP_NOTE
      : null
  const estimationNotes = [
    buildApproximationNote(required, detected),
    required.adjustmentNote,
    detected.adjustmentNote,
  ]

  if (ratio >= 1) {
    return {
      component,
      status: 'pass',
      requirementLabel,
      detectedLabel,
      note: joinNotes(...estimationNotes),
    }
  }

  if (ratio >= COMPATIBILITY_WARN_THRESHOLD_RATIO[component]) {
    return {
      component,
      status: 'warn',
      requirementLabel,
      detectedLabel,
      note: joinNotes(SHORTFALL_NOTE[component], ...estimationNotes, laptopTgpNote),
    }
  }

  // Un "no cumple" es un veredicto tajante y solo se emite cuando ambos lados
  // son el modelo real sin varianza oculta de portátil.
  if (isApproximate) {
    return {
      component,
      status: 'warn',
      requirementLabel,
      detectedLabel,
      note: joinNotes('Parece quedar por debajo del requisito.', ...estimationNotes, laptopTgpNote),
    }
  }

  return {
    component,
    status: 'fail',
    requirementLabel,
    detectedLabel,
    note: 'Por debajo del requisito.',
  }
}

function formatMb(mb: number): string {
  return mb >= 1024 ? `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB` : `${mb} MB`
}

/**
 * Score equivalente de un requisito genérico ("Dual core at 2.8 GHz") en la
 * escala del índice gaming derivado de PassMark:
 *   Core 2 Duo E8400  (2 núcleos, 3.0 GHz) → 2.85 · 3.0 · 2^0.55 ≈ 12.5 (tabla: 14.7)
 *   Phenom II X4 965  (4 núcleos, 3.4 GHz) → 2.85 · 3.4 · 4^0.55 ≈ 20.8 (tabla: 21.4)
 *   FX-8350           (8 núcleos, 4.0 GHz) → 2.85 · 4.0 · 8^0.55 ≈ 35.8 (tabla: 32.1)
 */
const LEGACY_SCORE_PER_GHZ = 2.85
const CORE_SCALING_EXPONENT = 0.55

function estimateGenericCpuScore(spec: GenericCpuSpec): number | null {
  if (spec.ghz === null) return null
  const cores = spec.cores ?? 1
  return LEGACY_SCORE_PER_GHZ * spec.ghz * cores ** CORE_SCALING_EXPONENT
}

type CheckOutcome = 'ok' | 'short' | 'ambiguous'

interface GenericCheck {
  outcome: CheckOutcome
  label: string
}

/**
 * Núcleos pedidos contra lo que sabemos del equipo. Con el modelo elegido se
 * usan sus núcleos físicos reales; sin él solo tenemos los hilos que reporta
 * el navegador, y de ahí únicamente se deduce un rango: con N hilos hay entre
 * N/2 y N núcleos.
 */
function checkCores(
  requiredCores: number,
  detectedModel: ResolvedModel<CpuBenchmarkEntry> | null,
  threads: number | null,
): GenericCheck | null {
  const label = `${requiredCores}+ núcleos`

  if (detectedModel) {
    return { outcome: detectedModel.entry.cores >= requiredCores ? 'ok' : 'short', label }
  }

  if (threads === null) return null
  if (threads < requiredCores) return { outcome: 'short', label }
  if (threads >= requiredCores * 2) return { outcome: 'ok', label }
  return { outcome: 'ambiguous', label }
}

function compareCpuByGenericSpec(
  hardware: DetectedHardware,
  requirementLabel: string,
  spec: GenericCpuSpec,
): ComponentVerdict {
  const detectedModel = resolveModel(hardware.cpuModel, typedCpuBenchmarks)
  const checks: GenericCheck[] = []

  if (spec.cores !== null) {
    const coreCheck = checkCores(spec.cores, detectedModel, hardware.cpuThreads)
    if (coreCheck) checks.push(coreCheck)
  }

  const requiredScore = estimateGenericCpuScore(spec)
  if (requiredScore !== null && detectedModel) {
    const label =
      spec.cores !== null
        ? `un CPU de ${spec.cores} núcleos a ${spec.ghz} GHz`
        : `un CPU a ${spec.ghz} GHz`
    checks.push({
      outcome: detectedModel.entry.score >= requiredScore ? 'ok' : 'short',
      label: `el rendimiento de ${label}`,
    })
  }

  const detectedLabel =
    hardware.cpuModel ??
    (hardware.cpuThreads !== null ? `${hardware.cpuThreads} hilos detectados` : 'No detectado')

  if (checks.length === 0) {
    return {
      component: 'cpu',
      status: 'unknown',
      requirementLabel,
      detectedLabel,
      note: 'Selecciona tu CPU para comparar contra este requisito genérico.',
    }
  }

  const short = checks.filter((check) => check.outcome === 'short')
  const ambiguous = checks.filter((check) => check.outcome === 'ambiguous')

  if (short.length > 0) {
    return {
      component: 'cpu',
      status: 'warn',
      requirementLabel,
      detectedLabel,
      note: `Por debajo de ${short.map((c) => c.label).join(' y ')} — estimado por especificación genérica, no por modelo exacto.`,
    }
  }

  if (ambiguous.length > 0) {
    return {
      component: 'cpu',
      status: 'warn',
      requirementLabel,
      detectedLabel,
      note: `Tu navegador reporta ${hardware.cpuThreads} hilos, que pueden ser menos núcleos físicos. Selecciona tu CPU para confirmar ${ambiguous.map((c) => c.label).join(' y ')}.`,
    }
  }

  return {
    component: 'cpu',
    status: 'pass',
    requirementLabel,
    detectedLabel,
    note: 'Comparado por especificación genérica, no por modelo exacto.',
  }
}

export function compareCpu(
  hardware: DetectedHardware,
  requirement: HardwareRequirement,
): ComponentVerdict {
  const requirementText = requirement.cpu
  const requirementLabel = requirementText ?? 'No especificado'

  if (!requirementText) {
    return {
      component: 'cpu',
      status: 'unknown',
      requirementLabel,
      detectedLabel: hardware.cpuModel ?? 'No ingresado',
    }
  }

  // Level 1: the requirement names a model we recognize, exactly or by proximity.
  const required = resolveModel(requirementText, typedCpuBenchmarks)

  if (required) {
    if (!hardware.cpuModel) {
      return {
        component: 'cpu',
        status: 'unknown',
        requirementLabel,
        detectedLabel: 'No ingresado',
        note: 'Selecciona tu CPU para verificar este requisito.',
      }
    }

    const detected = resolveModel(hardware.cpuModel, typedCpuBenchmarks)
    if (!detected) {
      return {
        component: 'cpu',
        status: 'unknown',
        requirementLabel,
        detectedLabel: hardware.cpuModel,
        note: 'No lo reconocemos en nuestra base de datos todavía.',
      }
    }

    const verdict = buildRatioVerdict(
      'cpu',
      requirementLabel,
      hardware.cpuModel,
      detected,
      required,
    )

    // Gate de hilos: un CPU rápido por hilo pero con menos núcleos e hilos que
    // el modelo pedido puede sufrir tirones en motores que reparten carga.
    if (
      verdict.status === 'pass' &&
      detected.entry.cores < required.entry.cores &&
      detected.entry.threads < required.entry.threads
    ) {
      return {
        ...verdict,
        status: 'warn',
        note: joinNotes(
          `Buen rendimiento por núcleo, pero tiene menos hilos (${detected.entry.cores} núcleos / ${detected.entry.threads} hilos frente a ${required.entry.cores}/${required.entry.threads}) y puede dar tirones en juegos exigentes.`,
          verdict.note,
        ),
      }
    }

    return verdict
  }

  // Level 2: not a known model — see if it's a generic spec instead (e.g. "Dual core at 2.8 GHz").
  const genericSpec = parseGenericCpuSpec(requirementText)
  if (genericSpec) {
    return compareCpuByGenericSpec(hardware, requirementLabel, genericSpec)
  }

  return {
    component: 'cpu',
    status: 'unknown',
    requirementLabel,
    detectedLabel: hardware.cpuModel ?? 'No ingresado',
    note: `No reconocemos "${requirementText}" ni encontramos un modelo equivalente, así que este requisito queda sin comparar.`,
  }
}

/** Steam escribe "11", "9.0c", "Version 12"; el backend ya deja solo el número. */
function parseDirectXVersion(raw: string | null): number | null {
  if (!raw) return null
  const match = raw.match(/\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : null
}

/** Versión de DirectX que asumimos para cualquier GPU de la tabla sin `maxDirectX`. */
const DEFAULT_MAX_DIRECTX = 12

/**
 * Si todas las alternativas de un texto de requisito mencionan explícitamente
 * una cantidad de VRAM ("GTX 1060 6GB / RX 580 8GB"), devuelve el mínimo en GB.
 */
function extractExplicitVramFloorGb(requirementText: string): number | null {
  const parts = requirementText.split(/\s*[,;|]\s*|\s+\/\s+|\s+(?:or|o|ó)\s+/i).filter(Boolean)
  if (parts.length === 0) return null

  const amountsGb: number[] = []
  for (const part of parts) {
    const spec = parseGenericGpuSpec(part)
    // Si una alternativa no menciona VRAM, el requisito no impone un piso explícito.
    if (!spec) return null
    amountsGb.push(spec.vramMb / 1024)
  }

  return Math.min(...amountsGb)
}

function checkDirectXSupport(
  requirement: HardwareRequirement,
  requirementLabel: string,
  detectedName: string,
  detected: ResolvedModel<GpuBenchmarkEntry> | null,
): ComponentVerdict | null {
  const requiredVersion = parseDirectXVersion(requirement.directx)
  if (requiredVersion === null || !detected) return null

  const supported = detected.entry.maxDirectX ?? DEFAULT_MAX_DIRECTX
  if (supported >= requiredVersion) return null

  if (isEstimate(detected)) {
    return {
      component: 'gpu',
      status: 'warn',
      requirementLabel,
      detectedLabel: detectedName,
      note: `Tu GPU parece admitir solo hasta DirectX ${supported} y el juego pide DirectX ${requiredVersion}.`,
    }
  }

  return {
    component: 'gpu',
    status: 'fail',
    requirementLabel,
    detectedLabel: detectedName,
    note: `Tu GPU admite hasta DirectX ${supported} y el juego pide DirectX ${requiredVersion}: no podrá iniciarlo.`,
  }
}

/** Level 2 fallback for GPU: compares an estimated VRAM figure, never returns "fail". */
function compareGpuByGenericSpec(
  hardware: DetectedHardware,
  requirementLabel: string,
  detectedName: string,
  spec: { vramMb: number },
): ComponentVerdict {
  const detectedVramMb = hardware.gpu.vramGb !== null ? hardware.gpu.vramGb * 1024 : null

  if (detectedVramMb === null) {
    return {
      component: 'gpu',
      status: 'unknown',
      requirementLabel,
      detectedLabel: detectedName,
      note: 'No pudimos estimar la VRAM de tu GPU para comparar este requisito genérico.',
    }
  }

  const requiredLabel = formatMb(spec.vramMb)

  if (detectedVramMb >= spec.vramMb) {
    return {
      component: 'gpu',
      status: 'pass',
      requirementLabel,
      detectedLabel: detectedName,
      note: `Comparado por VRAM estimada (≥ ${requiredLabel}), no por modelo exacto.`,
    }
  }

  return {
    component: 'gpu',
    status: 'warn',
    requirementLabel,
    detectedLabel: detectedName,
    note: `Tu VRAM estimada está por debajo de ${requiredLabel} — estimado, no por modelo exacto.`,
  }
}

export function compareGpu(
  hardware: DetectedHardware,
  requirement: HardwareRequirement,
): ComponentVerdict {
  const requirementText = requirement.gpu
  const requirementLabel =
    requirementText ?? (requirement.directx ? `DirectX ${requirement.directx}` : 'No especificado')
  const detectedName = hardware.gpu.name

  if (!detectedName) {
    return {
      component: 'gpu',
      status: 'unknown',
      requirementLabel,
      detectedLabel: 'No detectada',
      note: requirementText ? 'No se pudo detectar tu GPU.' : undefined,
    }
  }

  const detected = resolveGpuModel(detectedName)

  const directxVerdict = checkDirectXSupport(requirement, requirementLabel, detectedName, detected)
  if (directxVerdict) return directxVerdict

  if (!requirementText) {
    return {
      component: 'gpu',
      status: 'unknown',
      requirementLabel,
      detectedLabel: detectedName,
    }
  }

  // Level 1: the requirement names a model we recognize, exactly or by proximity.
  const required = resolveGpuModel(requirementText)

  if (required) {
    if (!detected) {
      return {
        component: 'gpu',
        status: 'unknown',
        requirementLabel,
        detectedLabel: detectedName,
        note: 'No lo reconocemos en nuestra base de datos todavía.',
      }
    }

    const verdict = buildRatioVerdict('gpu', requirementLabel, detectedName, detected, required)

    const explicitVramFloorGb = extractExplicitVramFloorGb(requirementText)
    if (
      verdict.status === 'pass' &&
      explicitVramFloorGb !== null &&
      detected.entry.formFactor !== 'igpu' &&
      detected.entry.vramGb < explicitVramFloorGb
    ) {
      return {
        ...verdict,
        status: 'warn',
        note: joinNotes(
          `El chip rinde lo suficiente, pero tu GPU tiene ~${detected.entry.vramGb} GB de VRAM y el requisito pide ${explicitVramFloorGb} GB: puede requerir bajar texturas.`,
          verdict.note,
        ),
      }
    }

    return verdict
  }

  // Level 2: not a known model — see if it's a generic spec instead (e.g. "128 MB video card").
  const genericSpec = parseGenericGpuSpec(requirementText)
  if (genericSpec) {
    return compareGpuByGenericSpec(hardware, requirementLabel, detectedName, genericSpec)
  }

  return {
    component: 'gpu',
    status: 'unknown',
    requirementLabel,
    detectedLabel: detectedName,
    note: `No reconocemos "${requirementText}" ni encontramos un modelo equivalente, así que este requisito queda sin comparar.`,
  }
}
