import { Link } from 'react-router-dom'
import { Gamepad2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { pickGradient } from '@/lib/pick-gradient'
import type { GameSearchResult } from '../types/game.types'

interface GameCardProps {
  game: GameSearchResult
}

export function GameCard({ game }: GameCardProps) {
  return (
    <Link
      to={`/juego/${game.id}`}
      className="group overflow-hidden rounded-lg border border-border bg-bg-elevated transition-colors hover:border-brand"
    >
      <div className="aspect-[460/215] overflow-hidden bg-bg-inset">
        {game.headerImage ? (
          <img
            src={game.headerImage}
            alt={game.name}
            loading="lazy"
            className="size-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div
            className={cn(
              'flex size-full items-center justify-center bg-gradient-to-br',
              pickGradient(game.id),
            )}
          >
            <Gamepad2 className="size-8 text-text-faint" aria-hidden />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="truncate font-display text-sm font-medium text-text">{game.name}</h3>
        {game.genres.length > 0 && (
          <p className="mt-1 truncate text-xs text-text-muted">{game.genres.join(' · ')}</p>
        )}
      </div>
    </Link>
  )
}
