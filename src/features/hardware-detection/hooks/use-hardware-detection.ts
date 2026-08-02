import { useCallback, useEffect, useState } from 'react'
import { detectHardware } from '../services/hardware-detection.service'
import { createEmptyDetectedHardware, type DetectedHardware } from '../types/hardware.types'

export type ScanStatus = 'scanning' | 'done'

interface UseHardwareDetectionResult {
  hardware: DetectedHardware
  status: ScanStatus
  setCpuModel: (model: string | null) => void
}

/**
 * Runs client-side hardware detection once on mount. CPU model can never be
 * read from the browser, so it stays null until the person fills it in —
 * the compatibility engine treats that field as "unknown" until then.
 */
export function useHardwareDetection(): UseHardwareDetectionResult {
  const [hardware, setHardware] = useState<DetectedHardware>(createEmptyDetectedHardware)
  const [status, setStatus] = useState<ScanStatus>('scanning')

  useEffect(() => {
    let cancelled = false

    detectHardware().then((result) => {
      if (cancelled) return
      setHardware((previous) => ({ ...result, cpuModel: previous.cpuModel }))
      setStatus('done')
    })

    return () => {
      cancelled = true
    }
  }, [])

  const setCpuModel = useCallback((model: string | null) => {
    setHardware((previous) => ({ ...previous, cpuModel: model?.trim() || null }))
  }, [])

  return { hardware, status, setCpuModel }
}
