import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { VerdictBadge } from './verdict-badge'
import { RequirementRow } from './requirement-row'
import type { CompatibilityReportData, RequirementVerdict } from '../types/compatibility.types'

interface RequirementTierCardProps {
  label: 'Mínimos' | 'Recomendados'
  tier: RequirementVerdict | null
}

/**
 * The tier being displayed is passed in explicitly as `label` rather than
 * read off `tier.tier` — when `tier` is null there's nothing to read a tier
 * name from, and inferring it produced a real bug (a missing "Recomendados"
 * tier used to render as a second, incorrect "Mínimos" card).
 */
function RequirementTierCard({ label, tier }: RequirementTierCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-text-muted">
          {label}
        </h3>
        {tier && <VerdictBadge status={tier.overall} size="lg" />}
      </CardHeader>
      <CardContent className="p-0">
        {tier ? (
          <div className="divide-y divide-border">
            <div className="grid grid-cols-2 gap-4 px-4 py-2">
              <span className="text-[0.65rem] uppercase tracking-widest font-semibold text-primary bg-primary/10 px-2 py-1 rounded text-center">
                Requisito
              </span>
              <span className="text-[0.65rem] uppercase tracking-widest font-semibold text-primary bg-primary/10 px-2 py-1 rounded text-center">
                Tu equipo
              </span>
            </div>
            {tier.components.map((component) => (
              <RequirementRow key={component.component} verdict={component} />
            ))}
          </div>
        ) : (
          <p className="p-4 text-sm text-text-muted">
            Este juego no especifica requisitos {label.toLowerCase()}.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

interface CompatibilityReportProps {
  report: CompatibilityReportData
}

export function CompatibilityReport({ report }: CompatibilityReportProps) {
  return (
    <div className="flex flex-col gap-4">
      <RequirementTierCard label="Mínimos" tier={report.minimum} />
      {report.recommended && <RequirementTierCard label="Recomendados" tier={report.recommended} />}
    </div>
  )
}
