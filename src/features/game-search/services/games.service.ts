import { env } from '@/config/env'
import { normalizeSearchText } from '@/lib/normalize-search-text'
import mockGames from '@/data/mock-games.json'
import type { GameDetail, GameSearchResult } from '../types/game.types'

const typedMockGames = mockGames as GameDetail[]

function shouldUseMockData(): boolean {
  return env.useMockData || !env.apiBaseUrl
}

function toSummary({ id, name, headerImage, genres }: GameDetail): GameSearchResult {
  return { id, name, headerImage, genres }
}

/** Small artificial delay so loading states are actually visible against local mock data. */
function simulateNetworkLatency(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 250))
}

async function searchGamesMock(query: string): Promise<GameSearchResult[]> {
  await simulateNetworkLatency()

  const target = normalizeSearchText(query)
  return typedMockGames
    .filter((game) => normalizeSearchText(game.name).includes(target))
    .map(toSummary)
}

async function searchGamesRemote(query: string): Promise<GameSearchResult[]> {
  const url = new URL('/search', env.apiBaseUrl)
  url.searchParams.set('q', query)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`No se pudo buscar juegos (status ${response.status})`)
  }

  return response.json() as Promise<GameSearchResult[]>
}

export async function searchGames(query: string): Promise<GameSearchResult[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  return shouldUseMockData() ? searchGamesMock(trimmed) : searchGamesRemote(trimmed)
}

export async function getFeaturedGames(): Promise<GameSearchResult[]> {
  if (!shouldUseMockData()) return []

  await simulateNetworkLatency()
  return typedMockGames.map(toSummary)
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

export async function getGameById(id: string): Promise<GameDetail | null> {
  return shouldUseMockData() ? getGameByIdMock(id) : getGameByIdRemote(id)
}
