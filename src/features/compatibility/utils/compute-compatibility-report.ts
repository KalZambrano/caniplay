import type { DetectedHardware } from '@/features/hardware-detection/types/hardware.types'
import type {
  GameRequirementSet,
  HardwareRequirement,
} from '@/features/game-search/types/game.types'
import { compareCpu, compareGpu, compareRam, compareStorage } from './compare-requirement'
import type {
  CompatibilityReportData,
  ComponentVerdict,
  RequirementVerdict,
  VerdictStatus,
} from '../types/compatibility.types'

const STATUS_PRIORITY: Record<VerdictStatus, number> = {
  fail: 3,
  warn: 2,
  unknown: 1,
  pass: 0,
}

/**
 * Storage is always structurally "unknown" (browsers can't read free disk
 * space), so it's excluded from the overall verdict — otherwise every game
 * would read as unverifiable regardless of how the rest of the rig compares.
 */
function aggregateOverallStatus(components: ComponentVerdict[]): VerdictStatus {
  const relevant = components.filter((component) => component.component !== 'storage')
  if (relevant.length === 0) return 'unknown'

  return relevant.reduce<VerdictStatus>(
    (worst, current) =>
      STATUS_PRIORITY[current.status] > STATUS_PRIORITY[worst] ? current.status : worst,
    'pass',
  )
}

function computeRequirementVerdict(
  tier: RequirementVerdict['tier'],
  requirement: HardwareRequirement,
  hardware: DetectedHardware,
): RequirementVerdict {
  const components: ComponentVerdict[] = [
    compareGpu(hardware, requirement),
    compareCpu(hardware, requirement),
    compareRam(hardware, requirement),
    compareStorage(requirement),
  ]

  return { tier, overall: aggregateOverallStatus(components), components }
}

export function computeCompatibilityReport(
  requirements: GameRequirementSet,
  hardware: DetectedHardware,
): CompatibilityReportData {
  return {
    minimum: requirements.minimum
      ? computeRequirementVerdict('minimum', requirements.minimum, hardware)
      : null,
    recommended: requirements.recommended
      ? computeRequirementVerdict('recommended', requirements.recommended, hardware)
      : null,
  }
}
