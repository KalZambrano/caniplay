import gpuBenchmarks from '@/data/gpu-benchmarks.json'
import cpuBenchmarks from '@/data/cpu-benchmarks.json'
import { findBenchmarkMatch, splitModelAlternatives } from '@/lib/benchmark-lookup'
import { describesSameModel, findApproximateBenchmarkMatch } from '@/lib/estimate-benchmark-match'
import { COMPATIBILITY_WARN_THRESHOLD_RATIO } from '@/config/constants'
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

  return {
    component: 'ram',
    status: isBrowserEstimate ? 'warn' : 'fail',
    requirementLabel,
    detectedLabel,
    note: isBrowserEstimate
      ? 'Estimación mínima del navegador — tu RAM real podría ser mayor.'
      : undefined,
  }
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
  approximate: boolean
}

/**
 * Resuelve un nombre libre contra la tabla: primero por nombre/alias y, si el
 * modelo no está tabulado, por el hermano de familia más parecido.
 *
 * Ese segundo intento es lo que evita el callejón sin salida de antes, donde
 * cualquier SKU ausente de la tabla —y son la mayoría, porque no existe lista
 * que las cubra todas— dejaba el requisito sin comparar.
 */
function resolveModel<T extends BenchmarkEntry>(
  rawName: string | null | undefined,
  table: readonly T[],
): ResolvedModel<T> | null {
  const matched = findBenchmarkMatch(rawName, table)

  if (matched && rawName) {
    // La comprobación solo tiene sentido sobre un nombre suelto: cuando el
    // texto enumera alternativas, que la elegida no sea la primera es el
    // funcionamiento normal, no un modelo perdido por el camino.
    const namesOneModel = splitModelAlternatives(rawName).length === 1
    return {
      entry: matched,
      approximate: namesOneModel && !describesSameModel(rawName, matched.name),
    }
  }

  const approximate = findApproximateBenchmarkMatch(rawName, table)
  return approximate ? { entry: approximate, approximate: true } : null
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

/** Shared "known model vs known model" scoring, once both sides resolved to a table entry. */
function buildRatioVerdict<T extends BenchmarkEntry>(
  component: 'cpu' | 'gpu',
  requirementLabel: string,
  detectedLabel: string,
  detected: ResolvedModel<T>,
  required: ResolvedModel<T>,
): ComponentVerdict {
  const ratio = detected.entry.score / required.entry.score
  const isApproximate = detected.approximate || required.approximate
  const approximationNote = buildApproximationNote(required, detected)

  if (ratio >= 1) {
    return {
      component,
      status: 'pass',
      requirementLabel,
      detectedLabel,
      note: joinNotes(approximationNote),
    }
  }

  if (ratio >= COMPATIBILITY_WARN_THRESHOLD_RATIO) {
    return {
      component,
      status: 'warn',
      requirementLabel,
      detectedLabel,
      note: joinNotes(
        'Probablemente corra, pero con ajustes gráficos reducidos.',
        approximationNote,
      ),
    }
  }

  // Un "no cumple" es un veredicto tajante y solo se emite cuando ambos lados
  // son el modelo real. Sobre un equivalente aproximado el margen de error
  // puede ser mayor que la propia diferencia, así que se queda en aviso.
  if (isApproximate) {
    return {
      component,
      status: 'warn',
      requirementLabel,
      detectedLabel,
      note: joinNotes('Parece quedar por debajo del requisito.', approximationNote),
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
 * Level 2 fallback for CPU: only reached when the requirement text didn't
 * match any known model. Compares whatever dimensions the text actually
 * states (core count, clock speed) against what we know about the user's
 * rig — auto-detected core count, and the selected CPU's base clock. Never
 * returns "fail": this is an approximate heuristic, not a model match, so a
 * shortfall is reported as "warn" rather than a confident rejection.
 */
function compareCpuByGenericSpec(
  hardware: DetectedHardware,
  requirementLabel: string,
  spec: GenericCpuSpec,
): ComponentVerdict {
  const detectedEntry = resolveModel(hardware.cpuModel, typedCpuBenchmarks)
  const checks: { ok: boolean; label: string }[] = []

  if (spec.cores !== null && hardware.cpuCores !== null) {
    checks.push({ ok: hardware.cpuCores >= spec.cores, label: `${spec.cores}+ núcleos` })
  }

  if (spec.ghz !== null && detectedEntry) {
    checks.push({ ok: detectedEntry.entry.baseClockGhz >= spec.ghz, label: `${spec.ghz} GHz` })
  }

  const detectedLabel =
    hardware.cpuModel ??
    (hardware.cpuCores !== null ? `${hardware.cpuCores} núcleos detectados` : 'No detectado')

  if (checks.length === 0) {
    return {
      component: 'cpu',
      status: 'unknown',
      requirementLabel,
      detectedLabel,
      note: 'Selecciona tu CPU para comparar contra este requisito genérico.',
    }
  }

  const failed = checks.filter((check) => !check.ok)

  if (failed.length === 0) {
    return {
      component: 'cpu',
      status: 'pass',
      requirementLabel,
      detectedLabel,
      note: `Comparado por especificación genérica (${checks.map((c) => c.label).join(' y ')}), no por modelo exacto.`,
    }
  }

  return {
    component: 'cpu',
    status: 'warn',
    requirementLabel,
    detectedLabel,
    note: `Por debajo de ${failed.map((c) => c.label).join(' y ')} — estimado por especificación genérica, no por modelo exacto.`,
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

    return buildRatioVerdict('cpu', requirementLabel, hardware.cpuModel, detected, required)
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
  const requirementLabel = requirementText ?? 'No especificado'
  const detectedName = hardware.gpu.name

  if (!requirementText) {
    return {
      component: 'gpu',
      status: 'unknown',
      requirementLabel,
      detectedLabel: detectedName ?? 'No detectada',
    }
  }

  if (!detectedName) {
    return {
      component: 'gpu',
      status: 'unknown',
      requirementLabel,
      detectedLabel: 'No detectada',
      note: 'No se pudo detectar tu GPU.',
    }
  }

  // Level 1: the requirement names a model we recognize, exactly or by proximity.
  const required = resolveModel(requirementText, typedGpuBenchmarks)

  if (required) {
    const detected = resolveModel(detectedName, typedGpuBenchmarks)
    if (!detected) {
      return {
        component: 'gpu',
        status: 'unknown',
        requirementLabel,
        detectedLabel: detectedName,
        note: 'No lo reconocemos en nuestra base de datos todavía.',
      }
    }

    return buildRatioVerdict('gpu', requirementLabel, detectedName, detected, required)
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
