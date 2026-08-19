import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Gamepad2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { pickGradient } from '@/lib/pick-gradient'
import type { GameSearchResult } from '../types/game.types'

interface GameCardProps {
  game: GameSearchResult
}

export function GameCard({ game }: GameCardProps) {
  // La búsqueda devuelve una cápsula grande opcional; si falla se baja a la
  // normal y, si esa también falla, al degradado. Se lleva en estado en vez de
  // reescribir `event.currentTarget.src`, porque el DOM devuelve la URL ya
  // resuelta a absoluta y compararla contra el string crudo podía no coincidir
  // nunca y dejar la imagen recargándose en bucle.
  const [source, setSource] = useState(game.headerImageLarge ?? game.headerImage)
  const [hasFailed, setHasFailed] = useState(false)

  function handleError() {
    if (source !== game.headerImage) {
      setSource(game.headerImage)
      return
    }
    setHasFailed(true)
  }

  return (
    <Link
      to={`/juego/${game.id}`}
      className="group overflow-hidden rounded-lg border border-border bg-bg-elevated transition-colors hover:border-brand focus-visible:border-brand"
    >
      <div className="aspect-header overflow-hidden bg-bg-inset">
        {source && !hasFailed ? (
          <img
            src={source}
            onError={handleError}
            alt={game.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className={cn(
              'flex size-full items-center justify-center bg-linear-to-br',
              pickGradient(game.id),
            )}
          >
            <Gamepad2 className="size-8 text-text-faint" aria-hidden />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="truncate font-display text-sm font-medium text-text transition-colors group-hover:text-brand-strong">
          {game.name}
        </h3>
        {game.genres.length > 0 && (
          <p className="mt-1 truncate text-xs text-text-muted">{game.genres.join(' · ')}</p>
        )}
      </div>
    </Link>
  )
}
