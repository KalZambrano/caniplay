import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { getCachedSearchResults, searchGames } from '../services/games.service'
import type { GameSearchResult } from '../types/game.types'

export type SearchStatus = 'idle' | 'loading' | 'success' | 'error'

interface UseGameSearchResult {
  query: string
  setQuery: (value: string) => void
  results: GameSearchResult[]
  status: SearchStatus
  errorMessage: string | null
}

const QUERY_PARAM = 'q'

function statusFor(query: string, cached: GameSearchResult[] | undefined): SearchStatus {
  if (!query.trim()) return 'idle'
  return cached ? 'success' : 'loading'
}

/**
 * La búsqueda vive en la URL (`/?q=elden`) para que sobreviva al ir al detalle
 * y volver, a recargar la página y a compartir el enlace. El input usa estado
 * local (escribir directo en la URL en cada tecla puede hacer saltar el cursor)
 * y solo el valor con debounce se escribe en la URL, con `replace` para no
 * llenar el historial con una entrada por letra.
 */
export function useGameSearch(): UseGameSearchResult {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQuery = searchParams.get(QUERY_PARAM) ?? ''

  const [query, setQuery] = useState(urlQuery)
  const debouncedQuery = useDebouncedValue(query, 300)

  // Lectura síncrona de la caché: al volver del detalle los resultados ya están
  // pintados en el primer render, sin spinner, y el scroll puede restaurarse.
  const [results, setResults] = useState<GameSearchResult[]>(
    () => getCachedSearchResults(urlQuery) ?? [],
  )
  const [status, setStatus] = useState<SearchStatus>(() =>
    statusFor(urlQuery, getCachedSearchResults(urlQuery)),
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Último valor que este hook y la URL tienen en común. Sirve para distinguir
  // cambios propios de cambios externos (atrás/adelante, clic en el logo…).
  const syncedQuery = useRef(urlQuery)

  // URL -> input, cuando la URL cambia por fuera del hook.
  useEffect(() => {
    if (urlQuery === syncedQuery.current) return
    syncedQuery.current = urlQuery
    setQuery(urlQuery)
  }, [urlQuery])

  // Input (con debounce) -> URL.
  useEffect(() => {
    const next = debouncedQuery.trim()
    if (next === syncedQuery.current) return
    syncedQuery.current = next
    setSearchParams(
      (previous) => {
        const params = new URLSearchParams(previous)
        if (next) params.set(QUERY_PARAM, next)
        else params.delete(QUERY_PARAM)
        return params
      },
      { replace: true, preventScrollReset: true },
    )
  }, [debouncedQuery, setSearchParams])

  useEffect(() => {
    const trimmed = debouncedQuery.trim()
    if (!trimmed) {
      setResults([])
      setStatus('idle')
      return
    }

    const cached = getCachedSearchResults(trimmed)
    if (cached) {
      setResults(cached)
      setStatus('success')
      return
    }

    let cancelled = false
    setStatus('loading')
    setErrorMessage(null)

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
