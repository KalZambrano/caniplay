import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ComboboxOption } from '@/components/ui/combobox'
import { isHardwareApiEnabled, searchHardwareRemote } from '@/services/hardware-api.service'
import { CPU_MODEL_OPTIONS, resolveCpuBrand, sortCpuOptions } from '../utils/cpu-options'

const DEBOUNCE_MS = 180
const LOCAL_CPU_NAMES = new Set(CPU_MODEL_OPTIONS.map((option) => option.value))

/**
 * Combines the bundled consumer CPU list (2,560 models) with on-demand D1
 * search results (5,586 models, including Xeon, Threadripper, and legacy parts)
 * whenever the backend API is enabled.
 */
export function useCpuOptions() {
  const [extraOptions, setExtraOptions] = useState<ComboboxOption[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      controllerRef.current?.abort()
    }
  }, [])

  const onQueryChange = useCallback((rawQuery: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    controllerRef.current?.abort()

    const trimmed = rawQuery.trim()
    if (!isHardwareApiEnabled() || trimmed.length < 2) return

    timerRef.current = setTimeout(() => {
      const controller = new AbortController()
      controllerRef.current = controller

      searchHardwareRemote('cpu', trimmed, 30, controller.signal)
        .then((items) => {
          if (controller.signal.aborted || items.length === 0) return

          setExtraOptions((previous) => {
            const known = new Set([...LOCAL_CPU_NAMES, ...previous.map((opt) => opt.value)])
            const additions: ComboboxOption[] = []

            for (const item of items) {
              if (known.has(item.name)) continue
              known.add(item.name)
              additions.push({
                value: item.name,
                label: item.name,
                group: resolveCpuBrand(item.name),
              })
            }

            return additions.length > 0 ? [...previous, ...additions] : previous
          })
        })
        .catch(() => {
          // Local options remain available if remote search fails.
        })
    }, DEBOUNCE_MS)
  }, [])

  const options = useMemo(
    () =>
      extraOptions.length === 0
        ? CPU_MODEL_OPTIONS
        : sortCpuOptions([...CPU_MODEL_OPTIONS, ...extraOptions]),
    [extraOptions],
  )

  return { options, onQueryChange }
}
