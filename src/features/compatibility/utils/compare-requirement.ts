import gpuBenchmarks from '@/data/gpu-benchmarks.json'
import cpuBenchmarks from '@/data/cpu-benchmarks.json'
import { findBenchmarkMatch } from '@/lib/benchmark-lookup'
import { COMPATIBILITY_WARN_THRESHOLD_RATIO } from '@/config/constants'
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

  if (required === null) {
    return { component: 'ram', status: 'unknown', detail: 'El juego no especifica RAM requerida.' }
  }

  if (detected === null) {
    return { component: 'ram', status: 'unknown', detail: 'No se pudo detectar tu RAM.' }
  }

  if (detected >= required) {
    return {
      component: 'ram',
      status: 'pass',
      detail: `${detected} GB detectados ≥ ${required} GB requeridos.`,
    }
  }

  return {
    component: 'ram',
    status: 'warn',
    detail: `El navegador detecta ${detected} GB, por debajo de los ${required} GB requeridos — esta lectura es una estimación mínima, tu RAM real podría ser mayor.`,
  }
}

export function compareStorage(requirement: HardwareRequirement): ComponentVerdict {
  if (requirement.storageGb === null) {
    return {
      component: 'storage',
      status: 'unknown',
      detail: 'El juego no especifica espacio requerido.',
    }
  }

  return {
    component: 'storage',
    status: 'unknown',
    detail: `Necesitas al menos ${requirement.storageGb} GB libres. El navegador no puede leer tu espacio en disco.`,
  }
}

function compareByBenchmark(
  detectedName: string | null,
  requiredName: string | null,
  table: readonly BenchmarkEntry[],
  component: 'cpu' | 'gpu',
  missingDetectedDetail: string,
): ComponentVerdict {
  if (!requiredName) {
    return { component, status: 'unknown', detail: 'El juego no especifica este componente.' }
  }

  if (!detectedName) {
    return { component, status: 'unknown', detail: missingDetectedDetail }
  }

  const requiredMatch = findBenchmarkMatch(requiredName, table)
  const detectedMatch = findBenchmarkMatch(detectedName, table)

  if (!requiredMatch) {
    return {
      component,
      status: 'unknown',
      detail: `No pudimos identificar "${requiredName}" en nuestra base de datos de referencia.`,
    }
  }

  if (!detectedMatch) {
    return {
      component,
      status: 'unknown',
      detail: `No reconocemos "${detectedName}" en nuestra base de datos de referencia todavía.`,
    }
  }

  const ratio = detectedMatch.score / requiredMatch.score

  if (ratio >= 1) {
    return {
      component,
      status: 'pass',
      detail: `${detectedMatch.name} supera a ${requiredMatch.name}, el requisito.`,
    }
  }

  if (ratio >= COMPATIBILITY_WARN_THRESHOLD_RATIO) {
    return {
      component,
      status: 'warn',
      detail: `${detectedMatch.name} está algo por debajo de ${requiredMatch.name} — probablemente corra con ajustes reducidos.`,
    }
  }

  return {
    component,
    status: 'fail',
    detail: `${detectedMatch.name} está por debajo de ${requiredMatch.name}, el requisito.`,
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
    'Ingresa el modelo de tu CPU para verificar este requisito.',
  )
}
