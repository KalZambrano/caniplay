// import { ScanSearch, Gamepad2, ListChecks } from 'lucide-react'
import { HardwareScanPanel } from '@/features/hardware-detection/components/hardware-scan-panel'
import { SearchBar } from '@/features/game-search/components/search-bar'
import { GameResultsGrid } from '@/features/game-search/components/game-results-grid'
import { GameCard } from '@/features/game-search/components/game-card'
import { useGameSearch } from '@/features/game-search/hooks/use-game-search'
import { useFeaturedGames } from '@/features/game-search/hooks/use-featured-games'
import { usePageTitle } from '@/hooks/use-page-title'

// const STEPS = [
//   {
//     icon: ScanSearch,
//     title: 'Detectamos tu equipo',
//     description: 'GPU, RAM y núcleos, directo desde tu navegador.',
//   },
//   {
//     icon: Gamepad2,
//     title: 'Buscas un juego',
//     description: 'Escribe el nombre y lo cruzamos con sus requisitos.',
//   },
//   {
//     icon: ListChecks,
//     title: 'Ves el veredicto',
//     description: 'Mínimos y recomendados, componente por componente.',
//   },
// ] as const

export function HomePage() {
  usePageTitle('CanIPlay — ¿Tu equipo puede correrlo?')

  const { query, setQuery, results, status, errorMessage } = useGameSearch()
  const { games: featuredGames } = useFeaturedGames()

  const isSearching = status !== 'idle'

  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col gap-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-4xl font-bold leading-tight text-text sm:text-5xl text-center">
            ¿Tu PC <span className="text-brand">corre</span> ese juego?
          </h1>
          <p className="mt-4 text-text-muted text-center">
            Descubre qué juegos puede ejecutar tu equipo.
          </p>
          <SearchBar value={query} onChange={setQuery} className="mt-6" />
        </div>
        <HardwareScanPanel />
      </section>

      {/* <section className="grid gap-6 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, description }, index) => (
          <div key={title} className="flex gap-3">
            <span className="font-mono text-sm text-text-faint">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <Icon className="mb-2 size-5 text-brand" aria-hidden />
              <h2 className="font-display text-sm font-semibold text-text">{title}</h2>
              <p className="mt-1 text-sm text-text-muted">{description}</p>
            </div>
          </div>
        ))}
      </section> */}

      <section>
        {isSearching ? (
          <GameResultsGrid
            query={query}
            results={results}
            status={status}
            errorMessage={errorMessage}
          />
        ) : (
          featuredGames.length > 0 && (
            <>
              <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-text-muted">
                Juegos de ejemplo
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {featuredGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </>
          )
        )}
      </section>
    </div>
  )
}
