export interface ParsedGpuString {
  vendor: string | null
  name: string | null
}

/**
 * WEBGL_debug_renderer_info typically returns a string like:
 *   "ANGLE (Intel, Intel(R) Iris(R) Xe Graphics (0x00009A49) Direct3D11 vs_5_0 ps_5_0, D3D11)"
 *   "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)"
 * On Linux/macOS it's often a plainer "Mesa Intel(R) UHD Graphics 620" or "Apple M1".
 */
export function parseWebglRenderer(raw: string): ParsedGpuString {
  const angleMatch = raw.match(/^ANGLE \(([^,]+),\s*([^,]+),/)

  if (angleMatch) {
    const vendor = angleMatch[1].trim()
    const name = angleMatch[2]
      .replace(/\(0x[0-9a-f]+\)/gi, '')
      .replace(/direct3d.*$/i, '')
      .trim()

    return { vendor, name: name || null }
  }

  const trimmed = raw.trim()
  return { vendor: null, name: trimmed || null }
}
