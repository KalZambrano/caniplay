import { VERDICT_PRESENTATION, COMPONENT_LABELS } from '../utils/verdict-presentation'
import type { ComponentVerdict } from '../types/compatibility.types'

interface RequirementRowProps {
  verdict: ComponentVerdict
}

export function RequirementRow({ verdict }: RequirementRowProps) {
  const { tone, icon: Icon } = VERDICT_PRESENTATION[verdict.status]

  const toneTextClass = {
    good: 'text-good',
    warn: 'text-warn',
    bad: 'text-bad',
    unknown: 'text-unknown',
  }[tone]

  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className={`mt-0.5 size-4 shrink-0 ${toneTextClass}`} aria-hidden />
      <div className="min-w-0">
        <p className="text-sm font-medium text-text">{COMPONENT_LABELS[verdict.component]}</p>
        <p className="text-sm text-text-muted">{verdict.detail}</p>
      </div>
    </div>
  )
}
