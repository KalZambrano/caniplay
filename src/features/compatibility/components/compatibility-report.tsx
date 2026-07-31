import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { VerdictBadge } from './verdict-badge'
import { RequirementRow } from './requirement-row'
import type { CompatibilityReportData, RequirementVerdict } from '../types/compatibility.types'

interface CompatibilityReportProps {
  report: CompatibilityReportData
}

function RequirementTierCard({ tier }: { tier: RequirementVerdict | null }) {
  const title = tier?.tier === 'recommended' ? 'Recomendados' : 'Mínimos'

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-text-muted">
          {title}
        </h3>
        {tier && <VerdictBadge status={tier.overall} size="lg" />}
      </CardHeader>
      <CardContent>
        {tier ? (
          <div className="divide-y divide-border">
            {tier.components.map((component) => (
              <RequirementRow key={component.component} verdict={component} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">
            Este juego no especifica requisitos {title.toLowerCase()}.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function CompatibilityReport({ report }: CompatibilityReportProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <RequirementTierCard tier={report.minimum} />
      <RequirementTierCard tier={report.recommended} />
    </div>
  )
}
