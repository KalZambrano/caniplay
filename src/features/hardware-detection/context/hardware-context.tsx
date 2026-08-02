import { createContext, useContext, type ReactNode } from 'react'
import { useHardwareDetection, type ScanStatus } from '../hooks/use-hardware-detection'
import type { DetectedHardware } from '../types/hardware.types'

interface HardwareContextValue {
  hardware: DetectedHardware
  status: ScanStatus
  setCpuModel: (model: string | null) => void
}

const HardwareContext = createContext<HardwareContextValue | null>(null)

/** Runs the hardware scan exactly once for the whole app session. */
export function HardwareProvider({ children }: { children: ReactNode }) {
  const value = useHardwareDetection()
  return <HardwareContext.Provider value={value}>{children}</HardwareContext.Provider>
}

export function useHardwareContext(): HardwareContextValue {
  const context = useContext(HardwareContext)
  if (!context) {
    throw new Error('useHardwareContext must be used within a HardwareProvider')
  }
  return context
}
