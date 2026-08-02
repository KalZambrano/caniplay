import { useEffect, useMemo, useRef, useState } from 'react'
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

/**
 * A text input that only ever resolves to one of `options` — typing filters
 * the list, but the value only changes when an option is actually picked
 * (or cleared). Used where a free-text field would let through values that
 * can never be matched later (e.g. a CPU model with a typo).
 */
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
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedLabel = options.find((option) => option.value === value)?.label ?? ''

  const filteredOptions = useMemo(() => {
    const target = normalizeSearchText(query)
    if (!target) return options
    return options.filter((option) => normalizeSearchText(option.label).includes(target))
  }, [options, query])

  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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

      {isOpen && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border-strong bg-bg-inset py-1 shadow-lg"
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
        </ul>
      )}
    </div>
  )
}
