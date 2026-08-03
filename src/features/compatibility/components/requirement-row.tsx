import { VERDICT_PRESENTATION, COMPONENT_LABELS } from '../utils/verdict-presentation'
import type { ComponentVerdict } from '../types/compatibility.types'

interface RequirementRowProps {
  verdict: ComponentVerdict
}

const TONE_TEXT_CLASS = {
  good: 'text-good',
  warn: 'text-warn',
  bad: 'text-bad',
  unknown: 'text-unknown',
} as const

/**
 * Two columns: the raw requirement as the game states it (left) and what we
 * detected or the person entered, plus the verdict icon (right). Kept
 * separate on purpose — mixing them into one sentence made it hard to tell
 * at a glance what came from the game versus from the user's rig.
 */
export function RequirementRow({ verdict }: RequirementRowProps) {
  const { tone, icon: Icon } = VERDICT_PRESENTATION[verdict.status]

  return (
    <div className="grid grid-cols-2 gap-4 px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-text-muted">{COMPONENT_LABELS[verdict.component]}</p>
        <p className="mt-0.5 line-clamp-2 font-mono text-sm text-text" title={verdict.requirementLabel}>
          {verdict.requirementLabel}
        </p>
      </div>

      <div
        className={`flex min-w-0 items-start justify-between gap-2 rounded-lg px-3 py-2`}
      >
        <div className="min-w-0">
          <p
            className="line-clamp-2 font-mono text-sm font-semibold text-blue-400"
            title={verdict.detectedLabel}
          >
            {verdict.detectedLabel}
          </p>
          {verdict.note && <p className="mt-1.5 text-xs text-text-muted">{verdict.note}</p>}
        </div>
        <Icon className={`mt-0.5 size-4 shrink-0 ${TONE_TEXT_CLASS[tone]}`} aria-hidden />
      </div>
    </div>
  )
}
