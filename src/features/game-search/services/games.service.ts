import { env } from '@/config/env'
import { normalizeSearchText } from '@/lib/normalize-search-text'
import mockGames from '@/data/mock-games.json'
import type { GameDetail, GameSearchResult } from '../types/game.types'

const typedMockGames = mockGames as GameDetail[]

function shouldUseMockData(): boolean {
  return env.useMockData || !env.apiBaseUrl
}

/**
 * `headerImageLarge` solo lo devuelve el backend en los resultados de búsqueda
 * (la ruta de detalle sigue usando `headerImage`), así que se propaga tal cual
 * llegue en vez de descartarse al armar el resumen.
 */
function toSummary({
  id,
  name,
  headerImage,
  headerImageLarge,
  genres,
}: GameDetail): GameSearchResult {
  return { id, name, headerImage, headerImageLarge, genres }
}

/** Small artificial delay so loading states are actually visible against local mock data. */
function simulateNetworkLatency(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 250))
}

async function searchGamesMock(query: string): Promise<GameSearchResult[]> {
  await simulateNetworkLatency()

  // Una query que se normaliza a vacío (ej. "···") haría que `.includes('')`
  // sea siempre true y devolviera el catálogo entero como si fuese un match.
  const target = normalizeSearchText(query)
  if (!target) return []

  return typedMockGames
    .filter((game) => normalizeSearchText(game.name).includes(target))
    .map(toSummary)
}

async function searchGamesRemote(query: string): Promise<GameSearchResult[]> {
  const url = new URL('/search', env.apiBaseUrl)
  url.searchParams.set('q', query)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('No se pudo buscar juegos')
  }

  return response.json() as Promise<GameSearchResult[]>
}

/**
 * Caché en memoria (vive mientras la pestaña esté abierta). Permite que volver
 * del detalle a los resultados sea instantáneo y, al poder leerse de forma
 * síncrona, que la lista ya esté pintada cuando `<ScrollRestoration />`
 * restaura el scroll. Se acota el tamaño descartando la entrada más antigua.
 */
const MAX_CACHE_ENTRIES = 50

function createCache<T>() {
  const values = new Map<string, T>()
  const inflight = new Map<string, Promise<T>>()

  return {
    get: (key: string) => values.get(key),
    /** Devuelve el valor cacheado, reutiliza una petición en curso o lanza una nueva. */
    load(key: string, loader: () => Promise<T>): Promise<T> {
      if (values.has(key)) return Promise.resolve(values.get(key) as T)

      const pending = inflight.get(key)
      if (pending) return pending

      const request = loader()
        .then((value) => {
          values.delete(key)
          values.set(key, value)
          if (values.size > MAX_CACHE_ENTRIES) {
            const oldest = values.keys().next().value
            if (oldest !== undefined) values.delete(oldest)
          }
          return value
        })
        .finally(() => inflight.delete(key))

      inflight.set(key, request)
      return request
    },
  }
}

const searchCache = createCache<GameSearchResult[]>()
const gameCache = createCache<GameDetail | null>()
const featuredCache = createCache<GameSearchResult[]>()

function toSearchKey(query: string): string {
  return query.trim().replace(/\s+/g, ' ').toLowerCase()
}

/** Lectura síncrona de la caché de búsqueda; `undefined` si aún no se pidió. */
export function getCachedSearchResults(query: string): GameSearchResult[] | undefined {
  const key = toSearchKey(query)
  return key ? searchCache.get(key) : []
}

export async function searchGames(query: string): Promise<GameSearchResult[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  return searchCache.load(toSearchKey(trimmed), () =>
    shouldUseMockData() ? searchGamesMock(trimmed) : searchGamesRemote(trimmed),
  )
}

/** Lectura síncrona de los destacados; `undefined` si aún no se pidieron. */
export function getCachedFeaturedGames(): GameSearchResult[] | undefined {
  return featuredCache.get('featured')
}

export function getFeaturedGames(): Promise<GameSearchResult[]> {
  return featuredCache.load('featured', loadFeaturedGames)
}

async function loadFeaturedGames(): Promise<GameSearchResult[]> {
  if (shouldUseMockData()) {
    await simulateNetworkLatency()
    return typedMockGames.map(toSummary)
  }

  // El backend todavía no implementa `/featured`, así que contra la API real no
  // se pide nada y la home simplemente no muestra destacados.
  return []

  // const response = await fetch(new URL('/featured', env.apiBaseUrl))
  // if (!response.ok) {
  //   throw new Error('No se pudieron cargar los juegos destacados')
  // }
  //
  // return response.json() as Promise<GameSearchResult[]>
}

async function getGameByIdMock(id: string): Promise<GameDetail | null> {
  await simulateNetworkLatency()
  return typedMockGames.find((game) => game.id === id) ?? null
}

async function getGameByIdRemote(id: string): Promise<GameDetail | null> {
  const response = await fetch(new URL(`/game/${id}`, env.apiBaseUrl))
  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`No se pudo cargar el juego (status ${response.status})`)
  }

  return response.json() as Promise<GameDetail>
}

/** Lectura síncrona del detalle; `undefined` si aún no se pidió. */
export function getCachedGame(id: string): GameDetail | null | undefined {
  return gameCache.get(id)
}

export function getGameById(id: string): Promise<GameDetail | null> {
  return gameCache.load(id, () =>
    shouldUseMockData() ? getGameByIdMock(id) : getGameByIdRemote(id),
  )
}

/** Precarga el detalle (ej. al pasar el ratón por una tarjeta). Ignora errores. */
export function prefetchGame(id: string): void {
  getGameById(id).catch(() => {})
}
