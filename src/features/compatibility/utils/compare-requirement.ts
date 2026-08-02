import gpuBenchmarks from '@/data/gpu-benchmarks.json'
import cpuBenchmarks from '@/data/cpu-benchmarks.json'
import { findBenchmarkMatch } from '@/lib/benchmark-lookup'
import { COMPATIBILITY_WARN_THRESHOLD_RATIO } from '@/config/constants'
import { formatRam } from '@/features/hardware-detection/utils/format-hardware'
import type { DetectedHardware } from '@/features/hardware-detection/types/hardware.types'
import type { HardwareRequirement } from '@/features/game-search/types/game.types'
import type {
  BenchmarkEntry,
  ComponentVerdict,
  GpuBenchmarkEntry,
} from '../types/compatibility.types'

const typedGpuBenchmarks = gpuBenchmarks as GpuBenchmarkEntry[]
const typedCpuBenchmarks = cpuBenchmarks as BenchmarkEntry[]

export function compareRam(
  hardware: DetectedHardware,
  requirement: HardwareRequirement,
): ComponentVerdict {
  const required = requirement.ramGb
  const detected = hardware.ramGb
  const requirementLabel = required !== null ? `${required} GB` : 'No especificado'

  if (required === null) {
    return {
      component: 'ram',
      status: 'unknown',
      requirementLabel,
      detectedLabel: detected !== null ? formatRam(detected) : 'No detectada',
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
      detectedLabel: formatRam(detected),
    }
  }

  return {
    component: 'ram',
    status: 'warn',
    requirementLabel,
    detectedLabel: formatRam(detected),
    note: 'Estimación mínima del navegador — tu RAM real podría ser mayor.',
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

function compareByBenchmark(
  detectedName: string | null,
  requiredName: string | null,
  table: readonly BenchmarkEntry[],
  component: 'cpu' | 'gpu',
  missingDetectedLabel: string,
  missingDetectedNote: string,
): ComponentVerdict {
  const requirementLabel = requiredName ?? 'No especificado'

  if (!requiredName) {
    return {
      component,
      status: 'unknown',
      requirementLabel,
      detectedLabel: detectedName ?? missingDetectedLabel,
    }
  }

  if (!detectedName) {
    return {
      component,
      status: 'unknown',
      requirementLabel,
      detectedLabel: missingDetectedLabel,
      note: missingDetectedNote,
    }
  }

  const requiredMatch = findBenchmarkMatch(requiredName, table)
  const detectedMatch = findBenchmarkMatch(detectedName, table)

  if (!requiredMatch) {
    return {
      component,
      status: 'unknown',
      requirementLabel,
      detectedLabel: detectedName,
      note: `No pudimos identificar "${requiredName}" en nuestra base de datos de referencia.`,
    }
  }

  if (!detectedMatch) {
    return {
      component,
      status: 'unknown',
      requirementLabel,
      detectedLabel: detectedName,
      note: 'No lo reconocemos en nuestra base de datos todavía.',
    }
  }

  const ratio = detectedMatch.score / requiredMatch.score

  if (ratio >= 1) {
    return { component, status: 'pass', requirementLabel, detectedLabel: detectedName }
  }

  if (ratio >= COMPATIBILITY_WARN_THRESHOLD_RATIO) {
    return {
      component,
      status: 'warn',
      requirementLabel,
      detectedLabel: detectedName,
      note: 'Probablemente corra, pero con ajustes gráficos reducidos.',
    }
  }

  return {
    component,
    status: 'fail',
    requirementLabel,
    detectedLabel: detectedName,
    note: 'Por debajo del requisito.',
  }
}

export function compareGpu(
  hardware: DetectedHardware,
  requirement: HardwareRequirement,
): ComponentVerdict {
  return compareByBenchmark(
    hardware.gpu.name,
    requirement.gpu,
    typedGpuBenchmarks,
    'gpu',
    'No detectada',
    'No se pudo detectar tu GPU.',
  )
}

export function compareCpu(
  hardware: DetectedHardware,
  requirement: HardwareRequirement,
): ComponentVerdict {
  return compareByBenchmark(
    hardware.cpuModel,
    requirement.cpu,
    typedCpuBenchmarks,
    'cpu',
    'No ingresado',
    'Selecciona tu CPU para verificar este requisito.',
  )
}
