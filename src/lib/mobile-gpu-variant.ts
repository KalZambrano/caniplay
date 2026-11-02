import { LAPTOP_GPU_PERFORMANCE_FACTOR, MAX_Q_GPU_PERFORMANCE_FACTOR } from '@/config/constants'

/**
 * Una GPU de portátil leída como lo que es: la versión de escritorio con la
 * que comparte nombre, más cuánto rinde respecto a ella.
 */
export interface MobileGpuVariant {
  /** El nombre sin los marcadores de portátil, listo para buscar en la tabla. */
  desktopName: string
  label: 'Laptop' | 'Max-Q'
  factor: number
}

const MAX_Q_MARKER = /\b(?:with\s+)?max[\s-]?q(?:\s+design)?\b/gi
const LAPTOP_MARKER = /\b(?:laptop|mobile|notebook)(?:\s+gpu)?\b/gi

/**
 * AMD e Intel marcan sus GPUs de portátil pegando una "M" al número
 * ("RX 6800M", "Arc A770M"). Sin quitarla, el número no encaja como palabra
 * con ningún alias y el modelo quedaba sin reconocer.
 */
const GLUED_M_SUFFIX = /\b(rx\s*\d{3,4}|a\d{3})m\b/gi

/**
 * Familias que existen en versión de escritorio y de portátil con el mismo
 * nombre. Las integradas (UHD, Iris, Radeon Graphics) son la misma pieza en
 * ambos casos y no deben recibir ninguna penalización.
 */
const DISCRETE_FAMILY = /\b(?:geforce\s+(?:gtx|rtx)|radeon\s+rx|arc\s+[ab]\d{3})\b/i

/**
 * Detecta si un nombre de GPU describe una variante de portátil.
 *
 * WebGL/WebGPU devuelven el nombre que publica el driver —"NVIDIA GeForce
 * RTX 3060 Laptop GPU"—, y la búsqueda por alias lo emparejaba con la RTX 3060
 * de escritorio, que rinde bastante más: el equipo quedaba sobrevalorado y un
 * juego podía salir como compatible sin serlo.
 */
export function detectMobileGpuVariant(rawName: string): MobileGpuVariant | null {
  const isMaxQ = new RegExp(MAX_Q_MARKER.source, 'i').test(rawName)
  const isLaptop = new RegExp(LAPTOP_MARKER.source, 'i').test(rawName)
  const hasGluedM = new RegExp(GLUED_M_SUFFIX.source, 'i').test(rawName)

  if (!isMaxQ && !isLaptop && !hasGluedM) return null

  const desktopName = rawName
    .replace(MAX_Q_MARKER, ' ')
    .replace(LAPTOP_MARKER, ' ')
    .replace(GLUED_M_SUFFIX, '$1')
    .replace(/\s+/g, ' ')
    .trim()

  return isMaxQ
    ? { desktopName, label: 'Max-Q', factor: MAX_Q_GPU_PERFORMANCE_FACTOR }
    : { desktopName, label: 'Laptop', factor: LAPTOP_GPU_PERFORMANCE_FACTOR }
}

/** ¿La entrada de la tabla es una GPU dedicada que también existe en portátil? */
export function hasMobileCounterpart(entryName: string): boolean {
  return DISCRETE_FAMILY.test(entryName)
}
