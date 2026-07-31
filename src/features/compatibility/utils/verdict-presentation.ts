import { Check, TriangleAlert, X, CircleHelp, type LucideIcon } from 'lucide-react'
import type { ComponentKey, VerdictStatus } from '../types/compatibility.types'

interface VerdictPresentation {
  label: string
  tone: 'good' | 'warn' | 'bad' | 'unknown'
  icon: LucideIcon
}

export const VERDICT_PRESENTATION: Record<VerdictStatus, VerdictPresentation> = {
  pass: { label: 'Corre bien', tone: 'good', icon: Check },
  warn: { label: 'Corre regular', tone: 'warn', icon: TriangleAlert },
  fail: { label: 'No corre', tone: 'bad', icon: X },
  unknown: { label: 'No verificado', tone: 'unknown', icon: CircleHelp },
}

export const COMPONENT_LABELS: Record<ComponentKey, string> = {
  cpu: 'Procesador',
  gpu: 'Tarjeta gráfica',
  ram: 'Memoria RAM',
  storage: 'Almacenamiento',
}
