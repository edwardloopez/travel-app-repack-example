/**
 * Toggle to trace prod bundle download + cache path in device logs.
 * This is useful for debugging bundle caching and download issues.
 * Set to false in production builds.
 */
export const MF_TRACE_ENABLED = true;

export function mfTrace(step: string, data?: Record<string, unknown>): void {
  if (!MF_TRACE_ENABLED) {
    return;
  }

  if (data !== undefined) {
    console.log(`[MF:Trace] ${step}`, data);
  } else {
    console.log(`[MF:Trace] ${step}`);
  }
}
