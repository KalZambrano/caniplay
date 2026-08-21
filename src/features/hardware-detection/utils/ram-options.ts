/**
 * Capacidades habituales en equipos de escritorio y portátiles. El navegador
 * solo da un piso (`navigator.deviceMemory` se topa en 8 GB), así que la
 * persona necesita poder corregirlo con su valor real.
 */
export const RAM_GB_OPTIONS = [2, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128] as const

/**
 * Lleva un valor detectado a la opción de la lista que le corresponde, para
 * que el select arranque marcando lo que se detectó. Si el navegador reporta
 * un valor intermedio (3 GB, por ejemplo), se elige la opción inmediata
 * superior: `deviceMemory` es un mínimo, nunca un máximo.
 */
export function toRamOption(ramGb: number | null): number | null {
  if (ramGb === null) return null
  return (
    RAM_GB_OPTIONS.find((option) => option >= ramGb) ?? RAM_GB_OPTIONS[RAM_GB_OPTIONS.length - 1]
  )
}
