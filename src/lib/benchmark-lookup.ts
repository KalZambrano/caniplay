import type { BenchmarkEntry } from '@/features/compatibility/types/compatibility.types'
import { normalizeHardwareName } from './normalize-hardware-name'

/**
 * Separadores con los que un requisito enumera alternativas: "Ryzen 5 1500X,
 * Intel Core i7-4770K", "i5-9600K or Ryzen 5 3600", "GTX 1060 / RX 580".
 *
 * La barra solo separa cuando va suelta entre espacios: pegada forma parte
 * del nombre ("GeForce 8600/9600GT", "Radeon HD2600/3600") y partir por ella
 * destruiría modelos que sí están en la tabla.
 */
const ALTERNATIVE_SEPARATOR = /\s*[,;|]\s*|\s+\/\s+|\s+(?:or|o|ó)\s+/i

/** Cada modelo que un texto de requisitos enumera, ya por separado. */
export function splitModelAlternatives(rawName: string): string[] {
  return rawName
    .split(ALTERNATIVE_SEPARATOR)
    .map((part) => normalizeHardwareName(part ?? ''))
    .filter(Boolean)
}

/** Aliases de 1-2 caracteres ("m1", "x") generan falsos positivos por contención. */
const MIN_CONTAINED_ALIAS_LENGTH = 3

interface NormalizedEntry<T> {
  entry: T
  aliases: string[]
}

// Normalizar los aliases es puro trabajo repetido: las tablas son constantes
// importadas, así que el resultado se cachea por tabla en vez de recalcularse
// en cada búsqueda.
const normalizedTableCache = new WeakMap<object, NormalizedEntry<BenchmarkEntry>[]>()

function getNormalizedEntries<T extends BenchmarkEntry>(table: readonly T[]): NormalizedEntry<T>[] {
  const cached = normalizedTableCache.get(table)
  if (cached) return cached as NormalizedEntry<T>[]

  const built = table.map((entry) => ({
    entry,
    aliases: entry.aliases.map(normalizeHardwareName).filter(Boolean),
  }))

  normalizedTableCache.set(table, built as NormalizedEntry<BenchmarkEntry>[])
  return built
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Contención por palabras completas, no por subcadena: "rx 570" está dentro de
 * "rx 5700 xt" como texto, pero son GPUs distintas y tratarlas como iguales
 * hundía el requisito varias gamas.
 */
function containsAsWords(target: string, alias: string): boolean {
  if (alias.length < MIN_CONTAINED_ALIAS_LENGTH) return false
  return new RegExp(`(?:^|\\s)${escapeRegExp(alias)}(?:\\s|$)`).test(target)
}

/**
 * Resuelve un único nombre (ya normalizado) contra la tabla.
 *
 * Gana el alias más largo que encaje, no el de menor score: "RTX 3060 Ti"
 * contiene el alias "rtx 3060", y quedarse con el más corto devolvía la
 * variante inferior del mismo modelo — un requisito rebajado en silencio.
 *
 * De ahí un invariante de las tablas: toda entrada debe listar su nombre
 * completo entre sus aliases. Si una lo omite, sus variantes compiten con el
 * alias corto y vuelve a ganar la equivocada.
 */
function matchSingleModel<T extends BenchmarkEntry>(target: string, table: readonly T[]): T | null {
  const entries = getNormalizedEntries(table)

  for (const { entry, aliases } of entries) {
    if (aliases.includes(target)) return entry
  }

  let best: { entry: T; aliasLength: number } | null = null

  for (const { entry, aliases } of entries) {
    for (const alias of aliases) {
      if (!containsAsWords(target, alias)) continue

      const isBetter =
        best === null ||
        alias.length > best.aliasLength ||
        (alias.length === best.aliasLength && entry.score < best.entry.score)

      if (isBetter) best = { entry, aliasLength: alias.length }
    }
  }

  return best?.entry ?? null
}

/**
 * Finds the benchmark entry a free-text hardware name most likely refers to.
 *
 * Requirement text and detected GPU/CPU strings rarely match a table entry
 * character-for-character, so this tries an exact alias match first, then
 * evalúa por separado cada alternativa que enumere el texto y, por último,
 * busca cualquier alias contenido en la cadena completa.
 *
 * Cuando el texto nombra varios modelos —"Intel Core i5-9600K or AMD Ryzen 5
 * 3600" nombra dos— gana el de menor score: ese "or" significa que cualquiera
 * de los dos basta, así que la barra real del juego es el más débil. La
 * comparación se hace ya resuelto cada modelo por su cuenta; hacerlo sobre la
 * cadena entera mezclaba ambos nombres y podía devolver un tercer modelo que
 * no era ninguno de los dos.
 *
 * Returns null rather than guessing when nothing matches — callers should
 * surface that as an "unknown" verdict, never a silent pass or fail.
 */
export function findBenchmarkMatch<T extends BenchmarkEntry>(
  rawName: string | null | undefined,
  table: readonly T[],
): T | null {
  if (!rawName) return null

  const target = normalizeHardwareName(rawName)
  if (!target) return null

  const entries = getNormalizedEntries(table)
  const exactMatch = entries.find(({ aliases }) => aliases.includes(target))
  if (exactMatch) return exactMatch.entry

  const alternatives = splitModelAlternatives(rawName)

  if (alternatives.length > 1) {
    const matches = alternatives
      .map((alternative) => matchSingleModel(alternative, table))
      .filter((match): match is T => match !== null)

    if (matches.length > 0) {
      return matches.reduce((weakest, match) => (match.score < weakest.score ? match : weakest))
    }
  }

  // Último recurso: puede que el split haya partido un nombre por la mitad
  // (una coma dentro del propio modelo), así que se reintenta entero.
  return matchSingleModel(target, table)
}
