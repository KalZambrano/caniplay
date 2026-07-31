export type OperatingSystem = 'windows' | 'mac' | 'linux'

export interface GameSummary {
  id: string
  name: string
  headerImage: string
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
  requirements: GameRequirementSet
}

export type GameSearchResult = GameSummary
