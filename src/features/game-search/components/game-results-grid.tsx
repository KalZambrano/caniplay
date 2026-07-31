import { Spinner } from '@/components/ui/spinner'
import { GameCard } from './game-card'
import type { GameSearchResult } from '../types/game.types'
import type { SearchStatus } from '../hooks/use-game-search'

interface GameResultsGridProps {
  query: string
  results: GameSearchResult[]
  status: SearchStatus
  errorMessage: string | null
}

export function GameResultsGrid({ query, results, status, errorMessage }: GameResultsGridProps) {
  if (status === 'idle') return null

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-text-muted">
        <Spinner />
        <span className="text-sm">Buscando «{query}»…</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <p className="rounded-md border border-bad/40 bg-bad-muted px-4 py-3 text-sm text-bad">
        {errorMessage ?? 'No se pudo completar la búsqueda.'}
      </p>
    )
  }

  if (results.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-text-muted">
        No encontramos juegos que coincidan con «{query}».
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {results.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  )
}
