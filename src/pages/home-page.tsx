import { Helmet } from 'react-helmet-async'
import { HardwareScanPanel } from '@/features/hardware-detection/components/hardware-scan-panel'
import { SearchBar } from '@/features/game-search/components/search-bar'
import { GameResultsGrid } from '@/features/game-search/components/game-results-grid'
import { GameCard } from '@/features/game-search/components/game-card'
import { useGameSearch } from '@/features/game-search/hooks/use-game-search'
import { useFeaturedGames } from '@/features/game-search/hooks/use-featured-games'
import { usePageTitle } from '@/hooks/use-page-title'

export function HomePage() {
  usePageTitle('CanIPlay — ¿Tu equipo puede correrlo?')

  const { query, setQuery, results, status, errorMessage } = useGameSearch()
  const { games: featuredGames } = useFeaturedGames()

  const isSearching = status !== 'idle'

  return (
    <div className="flex flex-col gap-12">
      <Helmet>
        <title>CanIPlay — ¿Tu equipo puede correrlo?</title>
        <meta
          name="description"
          content="CanIPlay detecta el hardware de tu PC en el navegador y verifica si cumple los requisitos mínimos o recomendados de cualquier juego."
        />
        <link rel="canonical" href="https://caniplay.app/" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="es_ES" />
        <meta property="og:title" content="CanIPlay — ¿Tu equipo puede correrlo?" />
        <meta
          property="og:description"
          content="CanIPlay detecta el hardware de tu PC en el navegador y verifica si cumple los requisitos mínimos o recomendados de cualquier juego."
        />
        <meta property="og:url" content="https://caniplay.app/" />
        <meta property="og:site_name" content="CanIPlay" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="CanIPlay — ¿Tu equipo puede correrlo?" />
        <meta
          name="twitter:description"
          content="CanIPlay detecta el hardware de tu PC en el navegador y verifica si cumple los requisitos mínimos o recomendados de cualquier juego."
        />
      </Helmet>
      <section className="flex flex-col gap-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-4xl font-bold leading-tight text-text sm:text-5xl">
            ¿Tu PC <span className="text-brand">corre</span> ese juego?
          </h1>
          <p className="mt-4 text-text-muted">Descubre qué juegos puede ejecutar tu equipo.</p>
          <SearchBar value={query} onChange={setQuery} className="mt-6 text-left" />
        </div>
        <HardwareScanPanel />
      </section>

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
