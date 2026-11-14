import type { MouseEvent } from 'react'
import { useLocation, useNavigate, type To } from 'react-router-dom'
import type { GameDetailLocationState } from '../types/navigation.types'

interface BackToSearch {
  to: To
  label: string
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void
}

/**
 * Enlace de "volver" para el detalle. Si el usuario llegó desde una tarjeta
 * (hay `state.from`), retrocede en el historial en lugar de empujar una entrada
 * nueva: así el navegador conserva la misma entrada de la búsqueda y
 * `<ScrollRestoration />` devuelve el scroll a donde estaba. Si entró directo
 * (enlace compartido, pestaña nueva), se comporta como un enlace normal a `/`.
 */
export function useBackToSearch(): BackToSearch {
  const navigate = useNavigate()
  const { state } = useLocation()
  const from = (state as GameDetailLocationState | null)?.from

  const hasResults = Boolean(from && new URLSearchParams(from.search).get('q'))

  return {
    to: from ?? '/',
    label: hasResults ? 'Volver a los resultados' : 'Volver a buscar',
    onClick(event) {
      if (!from) return
      // Respeta ctrl/cmd/shift/clic central para abrir en otra pestaña.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }
      event.preventDefault()
      navigate(-1)
    },
  }
}
