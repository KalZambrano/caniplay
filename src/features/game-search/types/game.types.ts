export type OperatingSystem = 'windows' | 'mac' | 'linux'

export interface Developer {
  name: string
  /**
   * Steam's API only returns the developer's name, never a URL — this is a
   * constructed link to Steam's own store search filtered by that developer,
   * not something Valve provides directly.
   */
  url: string
}

export interface GameSummary {
  id: string
  name: string
  headerImage: string
  headerImageLarge?: string
  genres: string[]
}

export interface HardwareRequirement {
  os: OperatingSystem
  cpu: string | null
  gpu: string | null
  ramGb: number | null
  storageGb: number | null
  directx: string | null
}

export interface GameRequirementSet {
  minimum: HardwareRequirement | null
  recommended: HardwareRequirement | null
}

export interface GameDetail extends GameSummary {
  shortDescription: string
  releaseDate: string | null
  developers: Developer[]
  requirements: GameRequirementSet
}

export type GameSearchResult = GameSummary
