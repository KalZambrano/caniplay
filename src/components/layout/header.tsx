import { Link } from 'react-router-dom'
import { ScanLine } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center px-4">
        <Link to="/" className="flex items-center gap-2 text-text hover:text-brand-strong">
          <ScanLine className="size-5 text-brand" aria-hidden />
          <span className="font-display text-lg font-bold tracking-wide">RIGSCAN</span>
        </Link>
      </div>
    </header>
  )
}
