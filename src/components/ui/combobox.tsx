import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { normalizeSearchText } from '@/lib/normalize-search-text'
import { Input } from './input'

export interface ComboboxOption {
  value: string
  label: string
  /** Encabezado bajo el que se agrupa la opción. Sin valor, va suelta. */
  group?: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  emptyMessage?: string
  className?: string
  id?: string
}

const LIST_MAX_HEIGHT = 224
const GAP = 4

interface ListboxPosition {
  top: number
  left: number
  width: number
  maxHeight: number
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder,
  emptyMessage = 'Sin resultados.',
  className,
  id,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [position, setPosition] = useState<ListboxPosition>({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: LIST_MAX_HEIGHT,
  })

  const listboxId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selectedLabel = options.find((option) => option.value === value)?.label ?? ''

  const filteredOptions = useMemo(() => {
    const target = normalizeSearchText(query)
    if (!target) return options
    return options.filter((option) => normalizeSearchText(option.label).includes(target))
  }, [options, query])

  /**
   * Agrupa por `group` respetando el orden en que cada grupo aparece por
   * primera vez, y numera las opciones de corrido: ese índice es el que usa el
   * teclado, así que sigue coincidiendo con el orden visual aunque agrupar
   * reordene la lista.
   */
  const groups = useMemo(() => {
    const buckets = new Map<string, ComboboxOption[]>()

    for (const option of filteredOptions) {
      const key = option.group ?? ''
      const bucket = buckets.get(key)
      if (bucket) bucket.push(option)
      else buckets.set(key, [option])
    }

    let index = 0
    return Array.from(buckets, ([label, groupOptions]) => ({
      label,
      entries: groupOptions.map((option) => ({ option, index: index++ })),
    }))
  }, [filteredOptions])

  const visibleOptions = useMemo(
    () => groups.flatMap((group) => group.entries.map((entry) => entry.option)),
    [groups],
  )

  /**
   * Abre hacia arriba cuando no cabe abajo, y recorta la altura a lo que
   * realmente queda libre. Con una altura fija la lista se salía de la
   * pantalla en móvil o con el campo cerca del borde inferior.
   */
  const updatePosition = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const spaceBelow = window.innerHeight - rect.bottom - GAP
    const spaceAbove = rect.top - GAP
    const openUpwards = spaceBelow < Math.min(LIST_MAX_HEIGHT, spaceAbove)
    const available = openUpwards ? spaceAbove : spaceBelow
    const maxHeight = Math.max(96, Math.min(LIST_MAX_HEIGHT, available))

    setPosition({
      top: openUpwards ? rect.top - GAP - maxHeight : rect.bottom + GAP,
      left: rect.left,
      width: rect.width,
      maxHeight,
    })
  }, [])

  useLayoutEffect(() => {
    if (!isOpen) return
    updatePosition()
  }, [isOpen, updatePosition, visibleOptions.length])

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (containerRef.current?.contains(target) || listRef.current?.contains(target)) return

      setIsOpen(false)
      setQuery('')
    }

    document.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, updatePosition])

  // Reinicia la opción activa cuando cambia el filtro, para que nunca apunte
  // fuera de rango tras teclear.
  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  // Sigue a la opción activa con el scroll para que el teclado no la pierda.
  useEffect(() => {
    if (!isOpen) return
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, isOpen])

  function openList() {
    const selectedIndex = visibleOptions.findIndex((option) => option.value === value)
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    setIsOpen(true)
  }

  function closeList() {
    setIsOpen(false)
    setQuery('')
  }

  function selectOption(option: ComboboxOption) {
    onChange(option.value)
    closeList()
  }

  function clearSelection() {
    onChange(null)
    setQuery('')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      closeList()
      return
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!isOpen) {
        openList()
        return
      }
      if (visibleOptions.length === 0) return

      const delta = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex(
        (previous) => (previous + delta + visibleOptions.length) % visibleOptions.length,
      )
      return
    }

    if (event.key === 'Home' && isOpen) {
      event.preventDefault()
      setActiveIndex(0)
      return
    }

    if (event.key === 'End' && isOpen) {
      event.preventDefault()
      setActiveIndex(Math.max(0, visibleOptions.length - 1))
      return
    }

    if (event.key === 'Enter' && isOpen) {
      const option = visibleOptions[activeIndex]
      if (!option) return
      event.preventDefault()
      selectOption(option)
    }
  }

  function renderOption(option: ComboboxOption, index: number) {
    const isSelected = option.value === value
    const isActive = index === activeIndex

    return (
      <div
        key={option.value}
        id={`${listboxId}-option-${index}`}
        role="option"
        aria-selected={isSelected}
        data-index={index}
        // El foco se queda en el input (patrón aria-activedescendant),
        // así que el puntero mueve la opción activa en vez de competir
        // con un estado :hover aparte.
        onMouseEnter={() => setActiveIndex(index)}
        onClick={() => selectOption(option)}
        className={cn(
          'cursor-pointer px-3 py-2 text-sm',
          isActive && 'bg-bg-elevated',
          isSelected ? 'font-medium text-brand-strong' : 'text-text',
        )}
      >
        {option.label}
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-faint"
          aria-hidden
        />
        <Input
          id={id}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            isOpen && visibleOptions[activeIndex] ? `${listboxId}-option-${activeIndex}` : undefined
          }
          autoComplete="off"
          value={isOpen ? query : selectedLabel}
          onChange={(event) => {
            setQuery(event.target.value)
            if (!isOpen) openList()
          }}
          onFocus={openList}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn('pl-9', value && !isOpen && 'pr-9')}
        />
        {value && !isOpen && (
          <button
            type="button"
            onClick={clearSelection}
            aria-label="Limpiar selección"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-text-faint transition-colors hover:text-text"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={listRef}
            id={listboxId}
            role="listbox"
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
              maxHeight: position.maxHeight,
            }}
            className="fixed z-50 overflow-auto rounded-md border border-border-strong bg-bg-inset py-1 shadow-lg shadow-black/40"
          >
            {visibleOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-text-faint">{emptyMessage}</div>
            ) : (
              groups.map((group, groupIndex) => {
                // Sin `group` no hay encabezado que mostrar: esas opciones van
                // sueltas y la lista se ve igual que antes de agrupar.
                if (!group.label) {
                  return (
                    <Fragment key={`ungrouped-${groupIndex}`}>
                      {group.entries.map((entry) => renderOption(entry.option, entry.index))}
                    </Fragment>
                  )
                }

                const headingId = `${listboxId}-group-${groupIndex}`

                return (
                  <div key={group.label} role="group" aria-labelledby={headingId}>
                    <div
                      id={headingId}
                      // Pegado arriba para que al hacer scroll siempre se vea a
                      // qué grupo pertenece lo que estás mirando.
                      className="sticky top-0 z-10 bg-bg-inset px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-widest text-text-faint"
                    >
                      {group.label}
                    </div>
                    {group.entries.map((entry) => renderOption(entry.option, entry.index))}
                  </div>
                )
              })
            )}
          </div>,
          document.body,
        )}
    </div>
  )
}
