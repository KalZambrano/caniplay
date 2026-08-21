import cpuBenchmarks from '@/data/cpu-benchmarks.json'
import type { BenchmarkEntry } from '@/features/compatibility/types/compatibility.types'
import type { ComboboxOption } from '@/components/ui/combobox'

const BRANDS = ['Intel', 'AMD'] as const
const OTHER_BRAND = 'Otros'

/** Los nombres del benchmark empiezan por la marca ("Intel Core i5-12400"). */
function resolveBrand(name: string): string {
  return BRANDS.find((brand) => name.startsWith(brand)) ?? OTHER_BRAND
}

// Ordena por marca y luego por modelo: el combobox conserva el orden de
// aparición de cada grupo, así que agrupar aquí fija también el orden de los
// encabezados (Intel, AMD y, si algún día aparece, Otros).
const BRAND_ORDER = [...BRANDS, OTHER_BRAND] as readonly string[]

export const CPU_MODEL_OPTIONS: ComboboxOption[] = (cpuBenchmarks as BenchmarkEntry[])
  .map((entry) => ({ value: entry.name, label: entry.name, group: resolveBrand(entry.name) }))
  .sort(
    (a, b) =>
      BRAND_ORDER.indexOf(a.group) - BRAND_ORDER.indexOf(b.group) || a.label.localeCompare(b.label),
  )
