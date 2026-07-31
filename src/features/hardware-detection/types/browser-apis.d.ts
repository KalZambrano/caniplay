/**
 * Minimal ambient types for browser APIs this feature relies on that aren't
 * part of TypeScript's bundled DOM lib yet: the Device Memory API and a
 * WebGPU adapter shape trimmed to just the fields we read.
 */
export {}

declare global {
  interface Navigator {
    /** Device Memory API. Chromium-only, and capped (e.g. reports 8 for 16/32/64 GB). */
    readonly deviceMemory?: number
    readonly gpu?: RigScanGpuNavigator
  }

  interface RigScanGpuNavigator {
    requestAdapter(): Promise<RigScanGpuAdapter | null>
  }

  interface RigScanGpuAdapter {
    readonly info?: RigScanGpuAdapterInfo
    requestAdapterInfo?: () => Promise<RigScanGpuAdapterInfo>
  }

  interface RigScanGpuAdapterInfo {
    vendor?: string
    architecture?: string
    device?: string
    description?: string
  }
}
