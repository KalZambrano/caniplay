import { useCallback, useEffect, useState } from 'react'
import { detectHardware } from '../services/hardware-detection.service'
import {
  createEmptyDetectedHardware,
  type DetectedHardware,
  type DetectionConfidence,
} from '../types/hardware.types'

export type ScanStatus = 'scanning' | 'done'

const CPU_MODEL_STORAGE_KEY = 'rigscan.hardware.cpuModel'
const RAM_STORAGE_KEY = 'rigscan.hardware.ramGb'

function readStoredCpuModel(): string | null {
  if (typeof window === 'undefined') return null

  try {
    const value = window.localStorage.getItem(CPU_MODEL_STORAGE_KEY)
    return value?.trim() || null
  } catch {
    return null
  }
}

function persistCpuModel(model: string | null) {
  if (typeof window === 'undefined') return

  try {
    if (model) {
      window.localStorage.setItem(CPU_MODEL_STORAGE_KEY, model)
      return
    }

    window.localStorage.removeItem(CPU_MODEL_STORAGE_KEY)
  } catch {
    // Ignore storage errors so the app keeps working even in private browsing.
  }
}

function readStoredRamGb(): number | null {
  if (typeof window === 'undefined') return null

  try {
    const value = Number(window.localStorage.getItem(RAM_STORAGE_KEY))
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

function persistRamGb(ramGb: number | null) {
  if (typeof window === 'undefined') return

  try {
    if (ramGb !== null) {
      window.localStorage.setItem(RAM_STORAGE_KEY, String(ramGb))
      return
    }

    window.localStorage.removeItem(RAM_STORAGE_KEY)
  } catch {
    // Ignore storage errors so the app keeps working even in private browsing.
  }
}

interface DetectedRam {
  ramGb: number | null
  confidence: DetectionConfidence
}

interface UseHardwareDetectionResult {
  hardware: DetectedHardware
  status: ScanStatus
  /** Lo que leyó el navegador, intacto: es a lo que se vuelve al descartar la elección manual. */
  detectedRamGb: number | null
  setCpuModel: (model: string | null) => void
  /** `null` descarta la elección manual y devuelve la RAM a lo detectado. */
  setRamGb: (ramGb: number | null) => void
}

/**
 * Runs client-side hardware detection once on mount. CPU model can never be
 * read from the browser, so it stays null until the person fills it in —
 * the compatibility engine treats that field as "unknown" until then.
 * RAM sí se detecta, pero solo como piso: la persona puede corregirlo y su
 * valor pasa a ser el bueno (`measured`).
 */
export function useHardwareDetection(): UseHardwareDetectionResult {
  const [hardware, setHardware] = useState<DetectedHardware>(() => {
    const emptyHardware = createEmptyDetectedHardware()
    const storedRamGb = readStoredRamGb()

    return {
      ...emptyHardware,
      cpuModel: readStoredCpuModel(),
      ramGb: storedRamGb,
      ramConfidence: storedRamGb !== null ? 'measured' : emptyHardware.ramConfidence,
    }
  })
  const [status, setStatus] = useState<ScanStatus>('scanning')
  // Se guarda aparte de `hardware` porque ahí la elección manual pisa el dato
  // del navegador, y sin esta copia no habría forma de volver a él.
  const [detectedRam, setDetectedRam] = useState<DetectedRam>({
    ramGb: null,
    confidence: 'unknown',
  })

  useEffect(() => {
    let cancelled = false

    detectHardware().then((result) => {
      if (cancelled) return

      setDetectedRam({ ramGb: result.ramGb, confidence: result.ramConfidence })
      // `previous.cpuModel` ya trae lo guardado (lo lee el inicializador de
      // estado) y, si la persona lo cambió o lo limpió mientras escaneábamos,
      // trae ese valor. Releer localStorage aquí resucitaba la selección que
      // acababan de borrar.
      setHardware((previous) => ({
        ...result,
        cpuModel: previous.cpuModel,
        // Una RAM elegida a mano manda sobre la estimación del navegador,
        // venga de una sesión anterior o de un cambio hecho mientras
        // escaneábamos.
        ...(previous.ramConfidence === 'measured'
          ? { ramGb: previous.ramGb, ramConfidence: previous.ramConfidence }
          : {}),
      }))
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

  const setRamGb = useCallback(
    (ramGb: number | null) => {
      setHardware((previous) => ({
        ...previous,
        ramGb: ramGb ?? detectedRam.ramGb,
        ramConfidence: ramGb !== null ? 'measured' : detectedRam.confidence,
      }))
      persistRamGb(ramGb)
    },
    [detectedRam],
  )

  return { hardware, status, detectedRamGb: detectedRam.ramGb, setCpuModel, setRamGb }
}
