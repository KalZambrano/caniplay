import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { DetectionConfidence } from '../types/hardware.types'

interface SpecPillProps {
  icon: ReactNode
  label: string
  value: string
  confidence: DetectionConfidence
  className?: string
}

/**
 * `measured` values render plain. `estimated` values get an asterisk, the
 * same honesty signal Steam/hardware-scan tools use for browser-derived
 * specs. `unknown` renders a muted dash instead of a fabricated number.
 */
export function SpecPill({ icon, label, value, confidence, className }: SpecPillProps) {
  return (
    <div className={cn('flex items-center gap-3 bg-bg-elevated px-4 py-3', className)}>
      <span className="text-text-faint">{icon}</span>
      <div className="flex flex-col">
        <span className="font-mono text-[0.65rem] uppercase tracking-widest text-text-faint">
          {label}
        </span>
        <span className="font-mono text-sm text-text">
          {confidence === 'unknown' ? '—' : value}
          {confidence === 'estimated' && <span className="ml-0.5 text-brand-strong">*</span>}
        </span>
      </div>
    </div>
  )
}
