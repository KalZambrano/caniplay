import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Gamepad2 } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'
import { pickGradient } from '@/lib/pick-gradient'
import { useGameDetail } from '@/features/game-search/hooks/use-game-detail'
import { useHardwareContext } from '@/features/hardware-detection/context/hardware-context'
import { useCompatibility } from '@/features/compatibility/hooks/use-compatibility'
import { CompatibilityReport } from '@/features/compatibility/components/compatibility-report'
import { usePageTitle } from '@/hooks/use-page-title'

export function GameDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { game, status, errorMessage } = useGameDetail(id)
  const { hardware } = useHardwareContext()
  const report = useCompatibility(game?.requirements ?? null, hardware)

  usePageTitle(game ? `${game.name} — CanIPlay` : 'CanIPlay')

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-text-muted">
        <Spinner />
        <span className="text-sm">Cargando juego…</span>
      </div>
    )
  }

  if (status === 'not-found') {
    return (
      <div className="py-24 text-center">
        <p className="text-text-muted">No encontramos ese juego.</p>
        <Link to="/" className="mt-4 inline-block">
          <Button variant="secondary" icon={<ArrowLeft className="size-4" />}>
            Volver a buscar
          </Button>
        </Link>
      </div>
    )
  }

  if (status === 'error' || !game || !report) {
    return (
      <p className="rounded-md border border-bad/40 bg-bad-muted px-4 py-3 text-sm text-bad">
        {errorMessage ?? 'No se pudo cargar este juego.'}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver a buscar
      </Link>

      {/* Título y géneros a ancho completo: encajonados en la columna estrecha
          del grid, el h1 se partía en tres líneas en escritorio. */}
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-3xl font-bold leading-tight text-text sm:text-4xl">
          {game.name}
        </h1>
        {game.genres.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {game.genres.map((genre) => (
              <Badge key={genre} tone="brand">
                {genre}
              </Badge>
            ))}
          </div>
        )}
      </header>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="overflow-hidden rounded-lg border border-border md:col-span-2">
          <div className="aspect-header bg-bg-inset">
            {game.headerImage ? (
              <img src={game.headerImage} alt={game.name} className="size-full object-cover" />
            ) : (
              <div
                className={cn(
                  'flex size-full items-center justify-center bg-linear-to-br',
                  pickGradient(game.id),
                )}
              >
                <Gamepad2 className="size-10 text-text-faint" aria-hidden />
              </div>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-4 rounded-lg border border-border bg-bg-elevated p-4">
          {game.releaseDate && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-faint">
                Fecha de lanzamiento
              </p>
              <p className="mt-1 text-sm text-text-muted">{game.releaseDate}</p>
            </div>
          )}

          {game.developers.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-faint">
                Desarrollado por
              </p>
              <p className="mt-1 text-sm text-text-muted">
                {game.developers.map((developer, index) => (
                  <span key={developer.name}>
                    {index > 0 && ', '}
                    <a
                      href={developer.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-strong transition-colors hover:text-brand hover:underline"
                    >
                      {developer.name}
                    </a>
                  </span>
                ))}
              </p>
            </div>
          )}

          {game.shortDescription && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-faint">
                Sobre el juego
              </p>
              <p className="mt-1 text-sm leading-relaxed text-text-muted">
                {game.shortDescription}
              </p>
            </div>
          )}
        </aside>
      </div>

      <CompatibilityReport report={report} />
    </div>
  )
}
