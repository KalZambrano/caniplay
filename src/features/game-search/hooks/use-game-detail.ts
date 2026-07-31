import { useEffect, useState } from 'react'
import { getGameById } from '../services/games.service'
import type { GameDetail } from '../types/game.types'

export type GameDetailStatus = 'loading' | 'success' | 'not-found' | 'error'

interface UseGameDetailResult {
  game: GameDetail | null
  status: GameDetailStatus
  errorMessage: string | null
}

export function useGameDetail(id: string | undefined): UseGameDetailResult {
  const [game, setGame] = useState<GameDetail | null>(null)
  const [status, setStatus] = useState<GameDetailStatus>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setStatus('not-found')
      return
    }

    let cancelled = false
    setStatus('loading')

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
