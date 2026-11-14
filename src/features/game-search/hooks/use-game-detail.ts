import { useEffect, useState } from 'react'
import { getCachedGame, getGameById } from '../services/games.service'
import type { GameDetail } from '../types/game.types'

export type GameDetailStatus = 'loading' | 'success' | 'not-found' | 'error'

interface UseGameDetailResult {
  game: GameDetail | null
  status: GameDetailStatus
  errorMessage: string | null
}

function statusFor(
  id: string | undefined,
  cached: GameDetail | null | undefined,
): GameDetailStatus {
  if (!id || cached === null) return 'not-found'
  return cached ? 'success' : 'loading'
}

export function useGameDetail(id: string | undefined): UseGameDetailResult {
  // Si el detalle ya se precargó (hover en la tarjeta) o se visitó antes, se
  // pinta en el primer render sin pasar por el spinner.
  const [game, setGame] = useState<GameDetail | null>(() =>
    id ? (getCachedGame(id) ?? null) : null,
  )
  const [status, setStatus] = useState<GameDetailStatus>(() =>
    statusFor(id, id ? getCachedGame(id) : undefined),
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setStatus('not-found')
      return
    }

    const cached = getCachedGame(id)
    if (cached !== undefined) {
      setGame(cached)
      setStatus(cached ? 'success' : 'not-found')
      return
    }

    let cancelled = false
    setStatus('loading')
    setErrorMessage(null)

    getGameById(id)
      .then((result) => {
        if (cancelled) return
        if (!result) {
          setStatus('not-found')
          return
        }
        setGame(result)
        setStatus('success')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setErrorMessage(
          error instanceof Error ? error.message : 'Error inesperado al cargar el juego.',
        )
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [id])

  return { game, status, errorMessage }
}
