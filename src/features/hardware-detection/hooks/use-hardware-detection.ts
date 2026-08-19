import { useCallback, useEffect, useState } from 'react'
import { detectHardware } from '../services/hardware-detection.service'
import { createEmptyDetectedHardware, type DetectedHardware } from '../types/hardware.types'

export type ScanStatus = 'scanning' | 'done'

const STORAGE_KEY = 'rigscan.hardware.cpuModel'

function readStoredCpuModel(): string | null {
  if (typeof window === 'undefined') return null

  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return value?.trim() || null
  } catch {
    return null
  }
}

function persistCpuModel(model: string | null) {
  if (typeof window === 'undefined') return

  try {
    if (model) {
      window.localStorage.setItem(STORAGE_KEY, model)
      return
    }

    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore storage errors so the app keeps working even in private browsing.
  }
}

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
  const [hardware, setHardware] = useState<DetectedHardware>(() => {
    const emptyHardware = createEmptyDetectedHardware()
    return { ...emptyHardware, cpuModel: readStoredCpuModel() }
  })
  const [status, setStatus] = useState<ScanStatus>('scanning')

  useEffect(() => {
    let cancelled = false

    detectHardware().then((result) => {
      if (cancelled) return
      // `previous.cpuModel` ya trae lo guardado (lo lee el inicializador de
      // estado) y, si la persona lo cambió o lo limpió mientras escaneábamos,
      // trae ese valor. Releer localStorage aquí resucitaba la selección que
      // acababan de borrar.
      setHardware((previous) => ({ ...result, cpuModel: previous.cpuModel }))
      setStatus('done')
    })

    return () => {
      cancelled = true
    }
  }, [])

  const setCpuModel = useCallback((model: string | null) => {
    const normalizedModel = model?.trim() || null
    setHardware((previous) => ({ ...previous, cpuModel: normalizedModel }))
    persistCpuModel(normalizedModel)
  }, [])

  return { hardware, status, setCpuModel }
}
