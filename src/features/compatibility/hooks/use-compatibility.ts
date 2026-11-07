import { useEffect, useMemo, useState } from 'react'
import type { DetectedHardware } from '@/features/hardware-detection/types/hardware.types'
import type { GameRequirementSet } from '@/features/game-search/types/game.types'
import { compareCompatibilityRemote, isHardwareApiEnabled } from '@/services/hardware-api.service'
import { computeCompatibilityReport } from '../utils/compute-compatibility-report'
import type { CompatibilityReportData } from '../types/compatibility.types'

interface RemoteReportState {
  key: string
  report: CompatibilityReportData
}

/**
 * Computes an immediate local report from the bundled consumer catalog so the UI
 * never flickers or blocks, and upgrades to the Cloudflare D1 comparison result
 * (covering all 7,219 desktop, laptop, workstation, and server models) whenever
 * the backend API is configured.
 */
export function useCompatibility(
  requirements: GameRequirementSet | null,
  hardware: DetectedHardware,
): CompatibilityReportData | null {
  const localReport = useMemo(() => {
    if (!requirements) return null
    return computeCompatibilityReport(requirements, hardware)
  }, [requirements, hardware])

  const remoteEnabled = isHardwareApiEnabled()
  const requestKey = useMemo(
    () => (requirements && remoteEnabled ? JSON.stringify({ requirements, hardware }) : null),
    [requirements, hardware, remoteEnabled],
  )

  const [remoteState, setRemoteState] = useState<RemoteReportState | null>(null)

  useEffect(() => {
    if (!requirements || !requestKey) return

    const controller = new AbortController()
    compareCompatibilityRemote(requirements, hardware, controller.signal)
      .then((report) => {
        if (!controller.signal.aborted) {
          setRemoteState({ key: requestKey, report })
        }
      })
      .catch(() => {
        // Keep the synchronous local report if offline or unreachable.
      })

    return () => {
      controller.abort()
    }
  }, [requirements, hardware, requestKey])

  if (!requirements) return null
  if (requestKey && remoteState?.key === requestKey) {
    return remoteState.report
  }
  return localReport
}
