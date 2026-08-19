import {
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
  const listRef = useRef<HTMLUListElement>(null)

  const selectedLabel = options.find((option) => option.value === value)?.label ?? ''

  const filteredOptions = useMemo(() => {
    const target = normalizeSearchText(query)
    if (!target) return options
    return options.filter((option) => normalizeSearchText(option.label).includes(target))
  }, [options, query])

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
  }, [isOpen, updatePosition, filteredOptions.length])

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
    const selectedIndex = filteredOptions.findIndex((option) => option.value === value)
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
      if (filteredOptions.length === 0) return

      const delta = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex(
        (previous) => (previous + delta + filteredOptions.length) % filteredOptions.length,
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
      setActiveIndex(Math.max(0, filteredOptions.length - 1))
      return
    }

    if (event.key === 'Enter' && isOpen) {
      const option = filteredOptions[activeIndex]
      if (!option) return
      event.preventDefault()
      selectOption(option)
    }
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
            isOpen && filteredOptions[activeIndex]
              ? `${listboxId}-option-${activeIndex}`
              : undefined
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
          <ul
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
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-text-faint">{emptyMessage}</li>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = option.value === value
                const isActive = index === activeIndex

                return (
                  <li
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
                  </li>
                )
              })
            )}
          </ul>,
          document.body,
        )}
    </div>
  )
}
