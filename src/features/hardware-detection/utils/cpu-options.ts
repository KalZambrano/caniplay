import cpuBenchmarks from '@/data/cpu-benchmarks.json'
import type { BenchmarkEntry } from '@/features/compatibility/types/compatibility.types'
import type { ComboboxOption } from '@/components/ui/combobox'

const BRANDS = ['Intel', 'AMD', 'Apple', 'Qualcomm'] as const
const OTHER_BRAND = 'Otros'

/** Los nombres del benchmark empiezan por la marca ("Intel Core i5-12400"). */
export function resolveCpuBrand(name: string): string {
  return BRANDS.find((brand) => name.startsWith(brand)) ?? OTHER_BRAND
}

const BRAND_ORDER = [...BRANDS, OTHER_BRAND] as readonly string[]

export function sortCpuOptions(options: ComboboxOption[]): ComboboxOption[] {
  return [...options].sort(
    (a, b) =>
      BRAND_ORDER.indexOf(a.group ?? OTHER_BRAND) - BRAND_ORDER.indexOf(b.group ?? OTHER_BRAND) ||
      a.label.localeCompare(b.label),
  )
}

export const CPU_MODEL_OPTIONS: ComboboxOption[] = sortCpuOptions(
  (cpuBenchmarks as BenchmarkEntry[]).map((entry) => ({
    value: entry.name,
    label: entry.name,
    group: resolveCpuBrand(entry.name),
  })),
)
