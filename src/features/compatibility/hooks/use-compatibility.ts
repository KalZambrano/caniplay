import { useMemo } from 'react'
import type { DetectedHardware } from '@/features/hardware-detection/types/hardware.types'
import type { GameRequirementSet } from '@/features/game-search/types/game.types'
import { computeCompatibilityReport } from '../utils/compute-compatibility-report'
import type { CompatibilityReportData } from '../types/compatibility.types'

export function useCompatibility(
  requirements: GameRequirementSet | null,
  hardware: DetectedHardware,
): CompatibilityReportData | null {
  return useMemo(() => {
    if (!requirements) return null
    return computeCompatibilityReport(requirements, hardware)
  }, [requirements, hardware])
}
