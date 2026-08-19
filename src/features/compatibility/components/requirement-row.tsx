import { cn } from '@/lib/cn'
import { VERDICT_PRESENTATION, COMPONENT_LABELS } from '../utils/verdict-presentation'
import type { ComponentVerdict } from '../types/compatibility.types'

interface RequirementRowProps {
  verdict: ComponentVerdict
}

/**
 * La columna "Tu equipo" se pinta con el tono del veredicto en vez de un color
 * fijo: resalta igual que un acento plano, pero además el color dice algo —
 * puedes recorrer la columna y ver de un vistazo qué falla, qué va justo y qué
 * no pudimos verificar, sin leer cada icono.
 */
const TONE_STYLES = {
  good: { surface: 'border-good bg-good/10', value: 'text-good' },
  warn: { surface: 'border-warn bg-warn/10', value: 'text-warn' },
  bad: { surface: 'border-bad bg-bad/10', value: 'text-bad' },
  unknown: { surface: 'border-unknown bg-unknown/10', value: 'text-unknown' },
} as const

/**
 * Two columns: the raw requirement as the game states it (left) and what we
 * detected or the person entered, plus the verdict icon (right). Kept
 * separate on purpose — mixing them into one sentence made it hard to tell
 * at a glance what came from the game versus from the user's rig.
 *
 * Ambas celdas son paneles con la misma caja (borde izquierdo de 2px + px-3),
 * así que sus textos caen en la misma vertical y coinciden con la cabecera de
 * la tarjeta. El nombre del componente va encima, a lo ancho, para que los dos
 * valores arranquen a la misma altura.
 *
 * Debajo de `sm` las columnas se apilan —a 360px, dos columnas de mono con
 * nombres de modelo completos se recortaban casi siempre— y cada panel recupera
 * su etiqueta, que en escritorio da la cabecera.
 */
export function RequirementRow({ verdict }: RequirementRowProps) {
  const { tone, icon: Icon } = VERDICT_PRESENTATION[verdict.status]
  const toneStyle = TONE_STYLES[tone]

  return (
    <div className="px-4 py-3">
      <p className="text-xs font-medium text-text-muted">{COMPONENT_LABELS[verdict.component]}</p>

      <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
        <div className="min-w-0 rounded-r-md border-l-2 border-border-strong bg-bg-inset/70 px-3 py-2">
          <p className="mb-0.5 text-[0.65rem] uppercase tracking-widest text-text-faint sm:hidden">
            Requisito
          </p>
          <p
            className="line-clamp-2 font-mono text-sm text-text-muted"
            title={verdict.requirementLabel}
          >
            {verdict.requirementLabel}
          </p>
        </div>

        <div
          className={cn(
            'flex min-w-0 items-start justify-between gap-3 rounded-r-md border-l-2 px-3 py-2',
            toneStyle.surface,
          )}
        >
          <div className="min-w-0">
            <p className="mb-0.5 text-[0.65rem] uppercase tracking-widest text-text-faint sm:hidden">
              Tu equipo
            </p>
            <p
              className={cn('line-clamp-2 font-mono text-sm font-semibold', toneStyle.value)}
              title={verdict.detectedLabel}
            >
              {verdict.detectedLabel}
            </p>
            {verdict.note && <p className="mt-1.5 text-xs text-text-muted">{verdict.note}</p>}
          </div>
          <Icon className={cn('mt-0.5 size-4 shrink-0', toneStyle.value)} aria-hidden />
        </div>
      </div>
    </div>
  )
}
