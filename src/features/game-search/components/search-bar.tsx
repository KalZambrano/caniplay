import { Search } from 'lucide-react'
import { cn } from '@/lib/cn'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function SearchBar({ value, onChange, className }: SearchBarProps) {
  return (
    <div
      className={cn(
        'flex h-14 items-center gap-3 rounded-lg border border-border-strong bg-bg-inset px-4',
        'focus-within:ring-2 focus-within:ring-brand',
        className,
      )}
    >
      <Search className="size-5 text-text-faint" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Busca un juego… ej. Dota 2"
        aria-label="Buscar un juego"
        className="h-full flex-1 bg-transparent text-base text-text placeholder:text-text-faint focus:outline-none"
      />
    </div>
  )
}
