import { useEffect, useState } from 'react'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { searchGames } from '../services/games.service'
import type { GameSearchResult } from '../types/game.types'

export type SearchStatus = 'idle' | 'loading' | 'success' | 'error'

interface UseGameSearchResult {
  query: string
  setQuery: (value: string) => void
  results: GameSearchResult[]
  status: SearchStatus
  errorMessage: string | null
}

export function useGameSearch(): UseGameSearchResult {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GameSearchResult[]>([])
  const [status, setStatus] = useState<SearchStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const debouncedQuery = useDebouncedValue(query, 300)

  useEffect(() => {
    const trimmed = debouncedQuery.trim()
    if (!trimmed) {
      setResults([])
      setStatus('idle')
      return
    }

    let cancelled = false
    setStatus('loading')

    searchGames(trimmed)
      .then((data) => {
        if (cancelled) return
        setResults(data)
        setStatus('success')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setErrorMessage(error instanceof Error ? error.message : 'Error inesperado al buscar.')
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [debouncedQuery])

  return { query, setQuery, results, status, errorMessage }
}
