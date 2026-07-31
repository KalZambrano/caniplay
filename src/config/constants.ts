/**
 * A detected component scoring at least this fraction of the required
 * component's benchmark score is treated as "playable" (warn) instead of a
 * hard fail — GPUs/CPUs a little below spec often still run a game at
 * reduced settings.
 */
export const COMPATIBILITY_WARN_THRESHOLD_RATIO = 0.85
