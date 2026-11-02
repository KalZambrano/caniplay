/**
 * A detected component scoring at least this fraction of the required
 * component's benchmark score is treated as "playable" (warn) instead of a
 * hard fail.
 *
 * The two components get different margins because they degrade differently:
 * a GPU shortfall can be absorbed by lowering resolution, quality presets or
 * enabling upscaling (FSR/DLSS/XeSS), so a GPU at ~70% of the requirement
 * often still runs the game. A CPU shortfall can't — game logic, AI and draw
 * calls don't get cheaper with graphics settings — so the CPU margin is
 * tighter (~87%, i.e. log2 headroom of -0.2).
 */
export const COMPATIBILITY_WARN_THRESHOLD_RATIO = {
  gpu: 0.7,
  cpu: 0.87,
} as const

/**
 * RAM chosen by hand is exact, but being slightly short isn't a launch
 * blocker: the OS pages to disk and the game stutters instead. Down to this
 * fraction of the requirement the verdict is "warn"; below it, "fail".
 */
export const RAM_WARN_THRESHOLD_RATIO = 0.75

/**
 * Laptop GPUs share the desktop name but run at a fraction of the power
 * budget. These are deliberately round, conservative estimates — real
 * laptop performance varies widely with the TGP each manufacturer sets.
 */
export const LAPTOP_GPU_PERFORMANCE_FACTOR = 0.75
export const MAX_Q_GPU_PERFORMANCE_FACTOR = 0.65
