import cpuBenchmarks from '@/data/cpu-benchmarks.json'
import type { BenchmarkEntry } from '@/features/compatibility/types/compatibility.types'
import type { ComboboxOption } from '@/components/ui/combobox'

export const CPU_MODEL_OPTIONS: ComboboxOption[] = (cpuBenchmarks as BenchmarkEntry[])
  .map((entry) => ({ value: entry.name, label: entry.name }))
  .sort((a, b) => a.label.localeCompare(b.label))
