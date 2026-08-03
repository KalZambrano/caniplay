import { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react'
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
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })

  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null) // 👈 importante

  const selectedLabel = options.find((option) => option.value === value)?.label ?? ''

  const filteredOptions = useMemo(() => {
    const target = normalizeSearchText(query)
    if (!target) return options
    return options.filter((option) => normalizeSearchText(option.label).includes(target))
  }, [options, query])

  const updateCoords = () => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setCoords({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    })
  }

  useLayoutEffect(() => {
    if (!isOpen) return
    updateCoords()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node

      // Si el click es dentro del input O dentro del listado del portal → no cerrar
      if (containerRef.current?.contains(target) || listRef.current?.contains(target)) {
        return
      }

      setIsOpen(false)
      setQuery('')
    }

    function handleReposition() {
      updateCoords()
    }

    // mousedown sigue siendo bueno (cierra antes de que se propague el click en otros sitios)
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleReposition, true)
    window.addEventListener('resize', handleReposition)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleReposition, true)
      window.removeEventListener('resize', handleReposition)
    }
  }, [isOpen])

  function selectOption(option: ComboboxOption) {
    onChange(option.value)
    setIsOpen(false)
    setQuery('')
  }

  function clearSelection() {
    onChange(null)
    setQuery('')
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
          aria-autocomplete="list"
          autoComplete="off"
          value={isOpen ? query : selectedLabel}
          onChange={(event) => {
            setQuery(event.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setIsOpen(false)
              setQuery('')
            }
            if (event.key === 'Enter' && filteredOptions.length > 0) {
              event.preventDefault()
              selectOption(filteredOptions[0])
            }
          }}
          placeholder={placeholder}
          className={cn('pl-9', value && !isOpen && 'pr-8')}
        />
        {value && !isOpen && (
          <button
            type="button"
            onClick={clearSelection}
            aria-label="Limpiar selección"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-faint hover:text-text"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {isOpen &&
        createPortal(
          <ul
            ref={listRef}
            role="listbox"
            style={{ top: coords.top, left: coords.left, width: coords.width }}
            className="fixed z-50 max-h-56 overflow-auto rounded-md border border-border-strong bg-bg-inset py-1 shadow-lg"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-text-faint">{emptyMessage}</li>
            ) : (
              filteredOptions.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.value === value}
                    onClick={() => selectOption(option)}
                    className={cn(
                      'block w-full px-3 py-2 text-left text-sm hover:bg-bg-elevated',
                      option.value === value ? 'text-brand-strong' : 'text-text',
                    )}
                  >
                    {option.label}
                  </button>
                </li>
              ))
            )}
          </ul>,
          document.body,
        )}
    </div>
  )
}
