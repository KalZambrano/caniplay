import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { DetectionConfidence } from '../types/hardware.types'

interface SpecPillProps {
  icon: ReactNode
  label: string
  value?: string
  confidence: DetectionConfidence
  /** Campo editable que ocupa el lugar del valor cuando el dato se puede corregir. */
  control?: ReactNode
  className?: string
}

/**
 * `measured` values render plain. `estimated` values get an asterisk, the
 * same honesty signal Steam/hardware-scan tools use for browser-derived
 * specs. `unknown` renders a muted dash instead of a fabricated number.
 * Con `control`, el campo ocupa el lugar del valor y es él quien muestra la
 * marca de confianza dentro de sus propias opciones: fuera no se pinta nada,
 * o el asterisco quedaría suelto junto a un valor que ya no le corresponde.
 */
export function SpecPill({ icon, label, value, confidence, control, className }: SpecPillProps) {
  return (
    <div className={cn('flex items-center gap-3 bg-bg-elevated px-4 py-3', className)}>
      <span className="text-text-faint">{icon}</span>
      <div className="flex min-w-0 flex-col">
        <span className="font-mono text-[0.65rem] uppercase tracking-widest text-brand-strong">
          {label}
        </span>
        <span className="flex min-w-0 items-center font-mono text-sm text-text">
          {control ?? (
            <>
              {confidence === 'unknown' ? '—' : value}
              {confidence === 'estimated' && <span className="ml-0.5 text-brand-strong">*</span>}
            </>
          )}
        </span>
      </div>
    </div>
  )
}
