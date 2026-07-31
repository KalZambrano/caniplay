import { useEffect, useState } from 'react'
import { getFeaturedGames } from '../services/games.service'
import type { GameSearchResult } from '../types/game.types'

export function useFeaturedGames() {
  const [games, setGames] = useState<GameSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    getFeaturedGames().then((data) => {
      if (cancelled) return
      setGames(data)
      setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return { games, isLoading }
}
