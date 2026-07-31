import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type BadgeTone = 'neutral' | 'brand' | 'good' | 'warn' | 'bad' | 'unknown'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

const toneStyles: Record<BadgeTone, string> = {
  neutral: 'bg-bg-inset text-text-muted border-border-strong',
  brand: 'bg-brand-muted text-brand-strong border-brand',
  good: 'bg-good-muted text-good border-good',
  warn: 'bg-warn-muted text-warn border-warn',
  bad: 'bg-bad-muted text-bad border-bad',
  unknown: 'bg-unknown-muted text-unknown border-unknown',
}

export function Badge({ tone = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        toneStyles[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
