import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Gamepad2 } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
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
        className="inline-flex w-fit items-center gap-1.5 text-sm text-text-muted hover:text-text"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver a buscar
      </Link>

      <div className='grid md:grid-cols-3 gap-5'>
        <div className="overflow-hidden rounded-lg border border-border col-span-2">
          <div className="aspect-16/7 bg-bg-inset">
            {game.headerImage ? (
              <img src={game.headerImage} alt={game.name} className="size-full object-cover" />
            ) : (
              <div
                className={`flex size-full items-center justify-center bg-linear-to-br ${pickGradient(game.id)}`}
              >
                <Gamepad2 className="size-10 text-text-faint" aria-hidden />
              </div>
            )}
          </div>
        </div>

        <div>
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">{game.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {game.genres.map((genre) => (
              <span
                key={genre}
                className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400"
              >
                {genre}
              </span>
            ))}
          </div>
          {game.releaseDate && (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-faint">
                Fecha de lanzamiento
              </p>
              <p className="mt-1 text-sm text-text-muted">{game.releaseDate}</p>
            </div>
          )}
          <p className="mt-3 max-w-2xl text-text-muted">{game.shortDescription}</p>
        </div>
      </div>

      <CompatibilityReport report={report} />
    </div>
  )
}
