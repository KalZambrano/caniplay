import { Badge } from '@/components/ui/badge'
import { VERDICT_PRESENTATION } from '../utils/verdict-presentation'
import type { VerdictStatus } from '../types/compatibility.types'

interface VerdictBadgeProps {
  status: VerdictStatus
  size?: 'sm' | 'lg'
}

export function VerdictBadge({ status, size = 'sm' }: VerdictBadgeProps) {
  const { label, tone, icon: Icon } = VERDICT_PRESENTATION[status]

  return (
    <Badge tone={tone} className={size === 'lg' ? 'px-4 py-2 text-sm' : undefined}>
      <Icon className={size === 'lg' ? 'size-4' : 'size-3.5'} aria-hidden />
      {label}
    </Badge>
  )
}
