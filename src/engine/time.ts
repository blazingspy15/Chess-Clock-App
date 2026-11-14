/**
 * Monotonic Time Provider for ChessClockEngine
 * 
 * Uses performance.now() where supported to avoid clock drift,
 * daylight savings jumps, NTP sync shifts, or OS time tampering.
 * Gracefully falls back to Date.now().
 */

export function getMonotonicTime(): number {
  if (
    typeof globalThis !== 'undefined' &&
    globalThis.performance &&
    typeof globalThis.performance.now === 'function'
  ) {
    return globalThis.performance.now();
  }
  return Date.now();
}
