/** `state` que la tarjeta de juego pasa al navegar al detalle. */
export interface GameDetailLocationState {
  from?: {
    pathname: string
    search: string
  }
}
